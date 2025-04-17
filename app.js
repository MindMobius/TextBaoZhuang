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
            alert('预览图导出功能将在后续实现');
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
        
        saveToLocalStorage() {
            localStorage.setItem('textTuner', JSON.stringify({
                originalText: this.originalText,
                styleLevel: this.styleLevel,
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