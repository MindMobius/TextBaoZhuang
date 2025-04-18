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
        showPreview: false,
        previewImageUrl: '',
        currentPage: 'detect', // 新增当前页面状态
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
        // 在PROVIDERS定义后添加一个公共请求方法
        // 修改makeApiRequest方法，添加systemPrompt参数
        async makeApiRequest(provider, apiKey, model, originalText, systemPrompt = '') {
            try {
                const messages = [];
                if (systemPrompt) {
                    messages.push({ role: "system", content: systemPrompt });
                }
                messages.push({ role: "user", content: originalText });

                const response = await fetch(`${provider.baseUrl}/chat/completions`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${apiKey}`
                    },
                    body: JSON.stringify({
                        model: model,
                        messages: messages
                    })
                });

                if (!response.ok) {
                    throw new Error(`API请求失败: ${response.status}`);
                }

                const data = await response.json();
                return data.choices[0].message.content;
            } catch (error) {
                console.error('API请求错误:', error);
                throw error;
            }
        },

        // 修改generateText方法调用
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

                const systemPrompt = window.PROMPTS.styleAdjust(this.styleLevel);
                this.generatedText = await this.makeApiRequest(
                    provider,
                    this.settings.apiKey,
                    this.settings.model,
                    this.originalText,  // 原文作为user消息
                    systemPrompt  // 提示作为system消息
                );
                this.saveToLocalStorage();
            } catch (error) {
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
                
                // 创建模型列表对话框
                const dialog = document.createElement('div');
                dialog.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4';
                dialog.innerHTML = `
                    <div class="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
                        <h2 class="text-xl font-semibold mb-4">模型列表</h2>
                        <h5 class="text-xs font-semibold mb-4">复制需要使用的模型名称，如：gemini-2.0-flash</h2>
                        <textarea class="w-full h-40 p-2 border rounded mb-4" readonly>${provider.models.join('\n')}</textarea>
                        <div class="flex justify-end space-x-2">
                            <button class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600" 
                                onclick="this.closest('.fixed').remove()">
                                关闭
                            </button>
                        </div>
                    </div>
                `;
                document.body.appendChild(dialog);
            } catch (error) {
                console.error(error);
                alert('获取模型列表时出错: ' + error.message);
            }
        },

        detectedLevel: null,
        detectedLevelText: '',
        Critique: '',

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

                const systemPrompt = window.PROMPTS.detectStyle();
                const result = await this.makeApiRequest(
                    provider,
                    this.settings.apiKey,
                    this.settings.model,
                    this.originalText,  // 原文作为user消息
                    systemPrompt  // 提示作为system消息
                );

                this.detectedLevel = parseInt(result);
                this.updateDetectedLevelText();
                await this.generateCritique();
                this.saveToLocalStorage();
            } catch (error) {
                console.error(error);
                alert('识别包装等级时出错: ' + error.message);
            }
        },

        // 优化后的generateCritique方法
        async generateCritique() {
            try {
                const provider = this.settings.provider === 'custom'
                    ? { baseUrl: this.settings.baseUrl }
                    : PROVIDERS[this.settings.provider];

                const prompt = window.PROMPTS.Critique(this.detectedLevel);
                this.Critique = await this.makeApiRequest(
                    provider,
                    this.settings.apiKey,
                    this.settings.model,
                    this.originalText,
                    prompt
                );
            } catch (error) {
                console.error(error);
                this.Critique = '生成批判时出错';
            }
        },

        updateDetectedLevelText() {
            const levelTexts = {
                '-2': '朴实无华',
                '-1': '不装',
                '0': '标准',
                '1': '小装一下',
                '2': '太tm装了'
            };
            this.detectedLevelText = levelTexts[this.detectedLevel] + " " + "级别" + parseInt(this.detectedLevel) || '未知';
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