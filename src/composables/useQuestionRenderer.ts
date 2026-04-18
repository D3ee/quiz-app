/**
 * 题目文本渲染组合式函数
 * 将题目中的 Markdown 格式（代码块、行内代码）转换为 HTML
 */
export function useQuestionRenderer() {
  /**
   * 渲染题目文本为 HTML
   * 处理流程：HTML 转义 → 代码块转换 → 行内代码转换 → 换行符转换
   * @param text - 原始题目文本
   * @returns 安全的 HTML 字符串
   */
  function renderQuestion(text: string): string {
    // 先进行 HTML 实体转义，防止 XSS
    const escaped = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    return escaped
      .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>') // 多行代码块
      .replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>')       // 行内代码
      .replace(/\n/g, '<br>')                                              // 换行符
  }

  return { renderQuestion }
}
