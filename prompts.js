const PROMPTS = {
    styleAdjust: (text, level) => {
        const levels = {
            '-3': '挖掘真实情况，分析风险，根据普适化经验给出最极端最真实',
            '-2': '用最直接、最朴实的语言表达，剖析文字',
            '-1': '简化语言，去除所有修饰，保持真实直白',
            '0': '保持原风格不变',
            '1': '增加专业术语和适度包装', 
            '2': '使用大量行业黑话、专业词汇和夸张表达，完全不考虑通俗易懂'
        };
        return `请将以下文案调整为${levels[level]}的风格:\n\n${text}，请直接输出调整后的文案，不要包含任何解释或说明。`;
    }
};

// 导出为全局变量
if (typeof window !== 'undefined') {
    window.PROMPTS = PROMPTS;
}