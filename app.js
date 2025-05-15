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
    },
    truthAnalysis: '',
};

function app() {
    return {
        originalText: '',
        styleLevel: 0,
        generatedText: '',
        showSettings: false,
        showPreview: false,
        hiddenMeaningInput: '',
        svgResult: '',
        previewImageUrl: '',
        currentPage: 'detect', // 新增当前页面状态
        settings: {
            provider: 'google',
            baseUrl: PROVIDERS.google.baseUrl,
            model: PROVIDERS.google.defaultModel,
            apiKey: ''
        },
        isLoading: false,
        styleSummaryResult: '',
        textImitationResult: '',
        textContinuationResult: '',
        textExpansionResult: '',

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
            this.isLoading = true; // 开始请求时设置为 true
            try {
                this.saveToLocalStorage();
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
            } finally {
                this.isLoading = false; // 请求结束后设置为 false
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
                this.startLoadingAnimation(); // 开始加载动画
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
                // this.saveToLocalStorage();
            } catch (error) {
                alert('生成文案时出错: ' + error.message);
            } finally {
                this.stopLoadingAnimation(); // 停止加载动画
            }
        },

        exportPreview() {
            if (!this.generatedText) {
                alert('请先生成文案');
                return;
            }

            this.isLoading = true;
            fetch('https://gist.githubusercontent.com/906051999/5bcff9c3ea0a7dffa273b4b82b6ca503/raw/6cbd5de37c8879bcfb3a816f6e38cc3c709199fc/TextBaoZhuang_qrcode')
                .then(response => response.text())
                .then(base64Data => {
                    try {
                        const previewDiv = document.createElement('div');
                        previewDiv.className = 'bg-white p-6 rounded-lg shadow-lg max-w-5xl mx-auto';
                        // Use marked to render Markdown to HTML
                        const htmlContent = marked.parse(this.generatedText);
                        previewDiv.innerHTML = `
                            <h2 class="text-xl font-semibold mb-4">${this.styleLevel}级包装文案：</h2>
                            <div class="text-wrapper whitespace-pre-line mb-4" style="
                                word-break: break-word;
                                font-size: 16px;
                                letter-spacing: 0.5px;
                                line-height: 1.4;
                            ">${htmlContent}</div>
                            <div class="footer-container text-xm text-gray-500 mt-4 flex items-center justify-between" style="
                                display: flex;
                                justify-content: space-between;
                                align-items: center;
                            ">
                                <span>来自 MindMobius/TextBaoZhuang</span>
                                <img src="${base64Data}" alt="二维码" class="h-28">
                            </div>
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
                })
                .catch(error => {
                    console.error('Failed to load Base64 data from Gist:', error);
                    alert('Failed to load QR code. Please check console for details.');
                    this.isLoading = false;
                });
        },

        copyGeneratedText() {
            if (!this.generatedText) {
                alert('请先生成文案');
                return;
            }

            navigator.clipboard.writeText(this.generatedText)
                .then(() => alert('文案已复制到剪贴板'))
                .catch(err => console.error('复制失败: ', err));
        },

        downloadPreview() {
            if (!this.previewImageUrl) return;

            const now = new Date();
            const filename = `TextBaoZhuang_${now.getFullYear()}_${now.getMonth() + 1}_${now.getDate()}_${now.getHours()}_${now.getMinutes()}_${now.getSeconds()}.png`;
            const link = document.createElement('a');
            link.download = filename;
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
                this.startLoadingAnimation(); // 开始加载动画
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
                // this.saveToLocalStorage();
            } catch (error) {
                console.error(error);
                alert('识别包装等级时出错: ' + error.message);
            } finally {
                this.stopLoadingAnimation(); // 停止加载动画
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

        truthAnalysis: '', // 初始化 truthAnalysis 变量

        // 添加新方法
        async analyzeTruth() {
            if (!this.originalText.trim()) {
                alert('请输入要分析的文案');
                return;
            }

            if (!this.settings.apiKey) {
                alert('请先配置API Key');
                this.showSettings = true;
                return;
            }

            try {
                this.startLoadingAnimation(); // 开始加载动画
                const provider = this.settings.provider === 'custom'
                    ? { baseUrl: this.settings.baseUrl }
                    : PROVIDERS[this.settings.provider];

                const prompt = window.PROMPTS.truthAnalysis();
                this.truthAnalysis = await this.makeApiRequest(
                    provider,
                    this.settings.apiKey,
                    this.settings.model,
                    this.originalText,
                    prompt
                );
            } catch (error) {
                console.error(error);
                this.truthAnalysis = '分析失败: ' + error.message;
            } finally {
                this.stopLoadingAnimation(); // 停止加载动画
            }
        },

        async analyzeHiddenMeaning() {
            if (!this.settings.apiKey) {
                alert('请先配置API Key');
                this.showSettings = true;
                return;
            }

            try {
                this.startLoadingAnimation(); // 开始加载动画
                const provider = this.settings.provider === 'custom'
                    ? { baseUrl: this.settings.baseUrl }
                    : PROVIDERS[this.settings.provider];

                const systemPrompt = window.PROMPTS.hiddenMeaning();
                const result = await this.makeApiRequest(
                    provider,
                    this.settings.apiKey,
                    this.settings.model,
                    this.originalText,  // 用户输入
                    systemPrompt  // 提示作为system消息
                );

                this.svgResult = result;
                // this.saveToLocalStorage();
            } catch (error) {
                console.error(error);
                alert('分析言外之意时出错: ' + error.message);
            } finally {
                this.stopLoadingAnimation(); // 停止加载动画
            }
        },

        // 添加新方法：风格总结
        async summarizeStyle() {
            if (!this.originalText.trim()) {
                alert('请输入要总结风格的文案');
                return;
            }

            if (!this.settings.apiKey) {
                alert('请先配置API Key');
                this.showSettings = true;
                return;
            }

            try {
                this.startLoadingAnimation();
                const provider = this.settings.provider === 'custom'
                    ? { baseUrl: this.settings.baseUrl }
                    : PROVIDERS[this.settings.provider];

                const prompt = window.PROMPTS.styleSummary();
                this.styleSummaryResult = await this.makeApiRequest(
                    provider,
                    this.settings.apiKey,
                    this.settings.model,
                    this.originalText,
                    prompt
                );
            } catch (error) {
                console.error(error);
                this.styleSummaryResult = '风格总结失败: ' + error.message;
            } finally {
                this.stopLoadingAnimation();
            }
        },

        // 添加新方法：文案仿写
        async imitateText() {
            if (!this.originalText.trim()) {
                alert('请输入要仿写的文案');
                return;
            }

            if (!this.settings.apiKey) {
                alert('请先配置API Key');
                this.showSettings = true;
                return;
            }

            try {
                this.startLoadingAnimation();
                const provider = this.settings.provider === 'custom'
                    ? { baseUrl: this.settings.baseUrl }
                    : PROVIDERS[this.settings.provider];

                const prompt = window.PROMPTS.textImitation();
                this.textImitationResult = await this.makeApiRequest(
                    provider,
                    this.settings.apiKey,
                    this.settings.model,
                    this.originalText,
                    prompt
                );
            } catch (error) {
                console.error(error);
                this.textImitationResult = '文案仿写失败: ' + error.message;
            } finally {
                this.stopLoadingAnimation();
            }
        },

        // 添加新方法：文案续写
        async continueText() {
            if (!this.originalText.trim()) {
                alert('请输入要续写的文案');
                return;
            }

            if (!this.settings.apiKey) {
                alert('请先配置API Key');
                this.showSettings = true;
                return;
            }

            try {
                this.startLoadingAnimation();
                const provider = this.settings.provider === 'custom'
                    ? { baseUrl: this.settings.baseUrl }
                    : PROVIDERS[this.settings.provider];

                const prompt = window.PROMPTS.textContinuation();
                this.textContinuationResult = await this.makeApiRequest(
                    provider,
                    this.settings.apiKey,
                    this.settings.model,
                    this.originalText,
                    prompt
                );
            } catch (error) {
                console.error(error);
                this.textContinuationResult = '文案续写失败: ' + error.message;
            } finally {
                this.stopLoadingAnimation();
            }
        },

        // 添加新方法：文案扩写
        async expandText() {
            if (!this.originalText.trim()) {
                alert('请输入要扩写的文案');
                return;
            }

            if (!this.settings.apiKey) {
                alert('请先配置API Key');
                this.showSettings = true;
                return;
            }

            try {
                this.startLoadingAnimation();
                const provider = this.settings.provider === 'custom'
                    ? { baseUrl: this.settings.baseUrl }
                    : PROVIDERS[this.settings.provider];

                const prompt = window.PROMPTS.textExpansion();
                this.textExpansionResult = await this.makeApiRequest(
                    provider,
                    this.settings.apiKey,
                    this.settings.model,
                    this.originalText,
                    prompt
                );
            } catch (error) {
                console.error(error);
                this.textExpansionResult = '文案扩写失败: ' + error.message;
            } finally {
                this.stopLoadingAnimation();
            }
        },

        startLoadingAnimation() {
            // 创建 loading 元素
            const loadingDiv = document.createElement('div');
            loadingDiv.id = 'loading-animation';
            loadingDiv.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0, 0, 0, 0.5);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 1000;
                color: white;
                font-size: 2em;
            `;
            loadingDiv.textContent = 'Loading...';
            document.body.appendChild(loadingDiv);

            // 使用 anime.js 创建动画
            anime({
                targets: loadingDiv,
                opacity: [0, 1],
                duration: 500,
                easing: 'easeInOutQuad'
            });
        },

        stopLoadingAnimation() {
            const loadingDiv = document.getElementById('loading-animation');
            if (loadingDiv) {
                anime({
                    targets: loadingDiv,
                    opacity: [1, 0],
                    duration: 500,
                    easing: 'easeInOutQuad',
                    complete: () => {
                        if (loadingDiv && loadingDiv.parentNode) {
                            loadingDiv.parentNode.removeChild(loadingDiv);
                        }
                    }
                });
            }
        },

    }
}

// 确保Alpine.js可以访问app函数
document.addEventListener('alpine:init', () => {
    Alpine.data('app', app);
});