function app() {
    return {
        originalText: '',
        styleLevel: 0,
        generatedText: '',
        
        async generateText() {
            if (!this.originalText.trim()) {
                alert('请输入原始文案');
                return;
            }
            
            // 这里需要替换为你的OpenAI API调用逻辑
            const prompt = `请将以下文案调整为风格等级${this.styleLevel}（-2到+2）:\n\n${this.originalText}`;
            
            // 模拟API响应
            this.generatedText = "这是生成的文案示例...";
            
            /* 实际API调用示例:
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer YOUR_API_KEY`
                },
                body: JSON.stringify({
                    model: "gpt-3.5-turbo",
                    messages: [{role: "user", content: prompt}]
                })
            });
            const data = await response.json();
            this.generatedText = data.choices[0].message.content;
            */
        },
        
        exportPreview() {
            // 这里实现导出预览图功能
            alert('预览图导出功能将在后续实现');
        }
    }
}