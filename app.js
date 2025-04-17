// 移除顶部的PROMPTS常量定义
// 直接使用全局的window.PROMPTS

// 提供商配置
const PROVIDERS = {
    openai: {
        name: 'OpenAI',
        baseUrl: 'https://api.openai.com/v1',
        models: [],
        defaultModel: 'gpt-4'
    },
    google: {
        name: 'Google',
        baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
        models: [],
        defaultModel: 'gemini-2.0-flash'
    },
    custom: {
        name: '自定义',
        baseUrl: '',
        models: [],
        defaultModel: ''
    }
};

function app() {
    return {
        originalText: '',
        styleLevel: 0,
        generatedText: '',
        showSettings: false,
        showPreview: false, // 新增预览状态
        previewImageUrl: '', // 新增预览图片URL
        settings: {
            provider: 'google',
            baseUrl: PROVIDERS.google.baseUrl,
            model: PROVIDERS.google.defaultModel,
            apiKey: ''
        },
        
        // 在init方法中添加
        init() {
            if (localStorage.getItem('textTuner')) {
                const saved = JSON.parse(localStorage.getItem('textTuner'));
                this.originalText = saved.originalText || '';
                this.styleLevel = saved.styleLevel || 0;
                this.settings = {
                    provider: saved.settings.provider || 'google',
                    baseUrl: saved.settings.baseUrl || PROVIDERS[saved.settings.provider || 'google'].baseUrl,
                    model: saved.settings.model || PROVIDERS[saved.settings.provider || 'google'].defaultModel,
                    apiKey: saved.settings.apiKey || ''
                };
            }
        },
        
        // 修改generateText方法
        async generateText() {
            if (!this.originalText.trim()) {
                alert('请输入原始文案');
                return;
            }
            
            if (!this.settings.apiKey) {
                alert('请先配置API Key');
                this.showSettings = true;
                return;
            }
            
            try {
                const provider = this.settings.provider === 'custom' 
                    ? { baseUrl: this.settings.baseUrl }
                    : PROVIDERS[this.settings.provider];
                
                const prompt = window.PROMPTS.styleAdjust(this.originalText, this.styleLevel);
                const response = await fetch(`${provider.baseUrl}/chat/completions`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.settings.apiKey}`
                    },
                    body: JSON.stringify({
                        model: this.settings.model,
                        messages: [{role: "user", content: prompt}]
                    })
                });
                
                const data = await response.json();
                this.generatedText = data.choices[0].message.content;
                this.saveToLocalStorage();
            } catch (error) {
                console.error(error);
                alert('生成文案时出错: ' + error.message);
            }
        },
        
        exportPreview() {
            if (!this.generatedText) {
                alert('请先生成文案');
                return;
            }
            
            this.isLoading = true;
            try {
                const previewDiv = document.createElement('div');
                previewDiv.className = 'bg-white p-6 rounded-lg shadow-lg max-w-md mx-auto';
                previewDiv.innerHTML = `
                    <h2 class="text-xl font-semibold mb-4">文案预览</h2>
                    <div class="whitespace-pre-line mb-4">${this.generatedText}</div>
                    <div class="text-sm text-gray-500 mt-4">来自TextTuner生成</div>
                `;
                document.body.appendChild(previewDiv);

                html2canvas(previewDiv, {
                    scale: 2,
                    logging: false,
                    useCORS: true
                }).then(canvas => {
                    this.previewImageUrl = canvas.toDataURL('image/png');
                    this.showPreview = true;
                    document.body.removeChild(previewDiv);
                }).catch(error => {
                    console.error(error);
                    alert('生成预览图时出错');
                });
            } catch (error) {
                console.error(error);
                alert('导出预览图时出错: ' + error.message);
            } finally {
                this.isLoading = false;
            }
        },
        
        downloadPreview() {
            if (!this.previewImageUrl) return;
            
            const link = document.createElement('a');
            link.download = 'texttuner-preview.png';
            link.href = this.previewImageUrl;
            link.click();
            this.showPreview = false;
        },
        
        // 修改fetchModels方法
        async fetchModels() {
            if (!this.settings.apiKey) {
                alert('请先配置API Key');
                return;
            }

            try {
                const provider = this.settings.provider === 'custom' 
                    ? { baseUrl: this.settings.baseUrl }
                    : PROVIDERS[this.settings.provider];
                
                const response = await fetch(`${provider.baseUrl}/models`, {
                    headers: {
                        'Authorization': `Bearer ${this.settings.apiKey}`
                    }
                });
                
                const data = await response.json();
                provider.models = data.data.map(m => m.id);
                alert(`获取到模型列表:\n${provider.models.join('\n')}`);
            } catch (error) {
                console.error(error);
                alert('获取模型列表时出错: ' + error.message);
            }
        },
        
        detectedLevel: null,
        detectedLevelText: '',
        luXunCritique: '', // 新增鲁迅式批判内容
        
        // 修改detectStyle方法
        async detectStyle() {
            if (!this.originalText.trim()) {
                alert('请输入要识别的文案');
                return;
            }
            
            if (!this.settings.apiKey) {
                alert('请先配置API Key');
                this.showSettings = true;
                return;
            }
            
            try {
                const provider = this.settings.provider === 'custom' 
                    ? { baseUrl: this.settings.baseUrl }
                    : PROVIDERS[this.settings.provider];
                
                const prompt = window.PROMPTS.detectStyle(this.originalText);
                const response = await fetch(`${provider.baseUrl}/chat/completions`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.settings.apiKey}`
                    },
                    body: JSON.stringify({
                        model: this.settings.model,
                        messages: [{role: "user", content: prompt}]
                    })
                });
                
                const data = await response.json();
                const result = data.choices[0].message.content;
                this.detectedLevel = parseInt(result);
                this.updateDetectedLevelText();
                await this.generateLuXunCritique(); // 新增鲁迅式批判生成
                this.saveToLocalStorage();
            } catch (error) {
                console.error(error);
                alert('识别包装等级时出错: ' + error.message);
            }
        },
        
        // 新增鲁迅式批判生成方法
        async generateLuXunCritique() {
            try {
                const provider = this.settings.provider === 'custom' 
                    ? { baseUrl: this.settings.baseUrl }
                    : PROVIDERS[this.settings.provider];
                
                const prompt = window.PROMPTS.luXunCritique(this.originalText, this.detectedLevel);
                const response = await fetch(`${provider.baseUrl}/chat/completions`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.settings.apiKey}`
                    },
                    body: JSON.stringify({
                        model: this.settings.model,
                        messages: [{role: "user", content: prompt}]
                    })
                });
                
                const data = await response.json();
                this.luXunCritique = data.choices[0].message.content;
            } catch (error) {
                console.error(error);
                this.luXunCritique = '生成鲁迅式批判时出错';
            }
        },
        
        updateDetectedLevelText() {
            const levelTexts = {
                '-3': '痛！太痛了！',
                '-2': '朴实无华',
                '-1': '不装',
                '0': '标准',
                '1': '小装一下',
                '2': '太tm装了'
            };
            this.detectedLevelText = levelTexts[this.detectedLevel] || '未知';
        },
        
        // 修改saveToLocalStorage方法
        saveToLocalStorage() {
            localStorage.setItem('textTuner', JSON.stringify({
                originalText: this.originalText,
                styleLevel: this.styleLevel,
                detectedLevel: this.detectedLevel,
                settings: this.settings
            }));
        },
        
        saveSettings() {
            this.saveToLocalStorage();
            this.showSettings = false;
        },
    }
}

// 确保Alpine.js可以访问app函数
document.addEventListener('alpine:init', () => {
    Alpine.data('app', app);
});