export function useQuestionRenderer() {
  function renderQuestion(text: string): string {
    const escaped = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    return escaped
      .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>')
      .replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>')
      .replace(/\n/g, '<br>')
  }

  return { renderQuestion }
}
