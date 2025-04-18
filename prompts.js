const PROMPTS = {
    styleAdjust: (level) => {
        const levels = {
            '-2': '去除一切表达技法，用最简化、最直接、最朴实的方式表达',
            '-1': '去除不必要的修饰，适度表达',
            '0': '保持原风格不变',
            '1': '增加专业术语和适度包装',
            '2': '使用巨量的行业黑话、专业词汇，完全不考虑通俗易懂，目的就是要让人看不懂，觉得很专业'
        };
        return `请将以下文案调整为${levels[level]}的风格，请直接输出调整后的文案，不要包含任何解释或说明。`;
    },

    detectStyle: () => {
        return `请分析以下文案的包装等级，从-3到2选择一个最匹配的数字:

包装等级说明:
'-2': '朴实直接，毫无修饰',
'-1': '简单高效，去芜存菁',
'0': '标准表达，不偏不倚，中庸之道',
'1': '适度修饰，讲究表达技巧，稍显刻意',
'2': '过度包装，术语堆砌，已不讲人话'

请只返回一个数字(-2到2)，不要包含任何其他文字或解释。`;
    },

    Critique: (level) => {
        return `解释为何以下文字内容的包装等级为何被评为 ${level}级 ，并给出犀利点评, 注意只从文字表达的角度分析, 不要评价内容：

包装等级说明:
'-2': '朴实直接，毫无修饰',
'-1': '简单高效，去芜存菁',
'0': '标准表达，不偏不倚，中庸之道',
'1': '适度修饰，讲究表达技巧，稍显刻意',
'2': '过度包装，术语堆砌，已不讲人话'

要求：
1. 先说明评为该等级的具体原因
2. 分析文案中的典型包装特征
3. 50字以内`;
    }
};

// 导出为全局变量
if (typeof window !== 'undefined') {
    window.PROMPTS = PROMPTS;
}