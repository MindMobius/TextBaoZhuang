const PROMPTS = {
    styleAdjust: (text, level) => {
        const levels = {
            '-2': '用最直接、最朴实的语言表达',
            '-1': '适当简化语言，减少修饰',
            '0': '保持原风格不变',
            '1': '适当增加修饰和包装',
            '2': '用最华丽、最正式的语言表达'
        };
        return `请将以下文案调整为${levels[level]}的风格:\n\n${text}`;
    }
};

function app() {
    return {
        originalText: '',
        styleLevel: 0,
        generatedText: '',
        showSettings: false,
        settings: {
            provider: 'openai',
            model: 'gpt-3.5-turbo',
            apiKey: ''
        },
        
        init() {
            if (localStorage.getItem('textTuner')) {
                const saved = JSON.parse(localStorage.getItem('textTuner'));
                this.originalText = saved.originalText || '';
                this.styleLevel = saved.styleLevel || 0;
                this.settings = saved.settings || this.settings;
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
                const prompt = PROMPTS.styleAdjust(this.originalText, this.styleLevel);
                const response = await fetch('https://api.openai.com/v1/chat/completions', {
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
        }
    }
}

// 确保Alpine.js可以访问app函数
document.addEventListener('alpine:init', () => {
    Alpine.data('app', app);
});