import React from 'react';

function AIOutput({ title, content, loading }) {
  if (loading) {
    return (
      <div className="ai-output-container">
        <div className="ai-loading">
          <div className="spinner"></div>
          <span>AI is analyzing your data...</span>
        </div>
      </div>
    );
  }

  if (!content) return null;

  // Parse markdown-like content into beautiful HTML
  const formatContent = (text) => {
    if (!text) return '';
    let html = text
      // Headers
      .replace(/^### (.+)$/gm, '<h4>$1</h4>')
      .replace(/^## (.+)$/gm, '<h3>$1</h3>')
      .replace(/^# (.+)$/gm, '<h2>$1</h2>')
      // Bold
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      // Italic
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      // Horizontal rules
      .replace(/^---$/gm, '<hr />')
      // Numbered lists
      .replace(/^\d+\.\s(.+)$/gm, '<li>$1</li>')
      // Bullet points
      .replace(/^[-•]\s(.+)$/gm, '<li>$1</li>')
      // Line breaks
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br />');

    // Wrap consecutive <li> elements in <ul>
    html = html.replace(/(<li>.*?<\/li>(?:<br \/>)?)+/g, (match) => {
      const cleaned = match.replace(/<br \/>/g, '');
      return `<ul>${cleaned}</ul>`;
    });

    return `<p>${html}</p>`;
  };

  return (
    <div className="ai-output-container">
      <div className="ai-output-header">
        <span style={{ fontSize: '1.5rem' }}>&#x2728;</span>
        <h3>{title || 'AI Analysis Results'}</h3>
      </div>
      <div
        className="ai-output-body"
        dangerouslySetInnerHTML={{ __html: formatContent(content) }}
      />
    </div>
  );
}

export default AIOutput;
