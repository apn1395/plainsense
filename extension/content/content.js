// Create and inject the PlainSense button
function injectButton() {
  const button = document.createElement('button');
  button.className = 'plainsense-button';
  button.textContent = '🧠 PlainSense This';
  button.addEventListener('click', handleButtonClick);
  document.body.appendChild(button);
}

// Create and show the modal
function showModal(content = null) {
  const overlay = document.createElement('div');
  overlay.className = 'plainsense-overlay';
  
  const modal = document.createElement('div');
  modal.className = 'plainsense-modal';
  
  const closeButton = document.createElement('button');
  closeButton.className = 'plainsense-close';
  closeButton.textContent = '×';
  closeButton.onclick = () => {
    overlay.remove();
  };
  
  // Close on click outside the modal
  overlay.onclick = (e) => {
    if (e.target === overlay) {
      overlay.remove();
    }
  };
  
  modal.appendChild(closeButton);
  
  if (content) {
    modal.appendChild(content);
  } else {
    modal.innerHTML += `
      <div class="plainsense-loading">
        <div class="plainsense-spinner"></div>
      </div>
    `;
  }
  
  overlay.appendChild(modal);
  document.body.appendChild(overlay);
  return modal;
}

// Extract article content using Readability
function extractArticle() {
  const documentClone = document.cloneNode(true);
  const article = new Readability(documentClone).parse();
  return article;
}

// Format the API response into HTML
function formatResponse(response) {
  const container = document.createElement('div');
  container.style.cssText = `
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 14px;
    line-height: 1.6;
    color: #1a1a1a;
    padding: 24px;
    position: relative;
  `;

  // Add copy button
  const copyButton = document.createElement('button');
  copyButton.className = 'plainsense-copy-button';
  copyButton.textContent = 'Copy Analysis';
  copyButton.onclick = async () => {
    const textContent = [
      'Article Analysis\n\n',
      'TLDR:\n' + response.tldr + '\n\n',
      'Market Impact:\n' + response.market_impact + '\n\n',
      'Portfolio Impact:\n' + response.portfolio_impact
    ].join('');

    try {
      await navigator.clipboard.writeText(textContent);
      copyButton.textContent = 'Copied!';
      copyButton.classList.add('copied');
      setTimeout(() => {
        copyButton.textContent = 'Copy Analysis';
        copyButton.classList.remove('copied');
      }, 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };
  container.appendChild(copyButton);
  
  const title = document.createElement('h2');
  title.textContent = 'Article Analysis';
  title.style.cssText = `
    font-size: 20px;
    margin: 0 0 24px 0;
    font-weight: 600;
  `;
  container.appendChild(title);
  
  // TLDR Section
  const tldrSection = document.createElement('section');
  tldrSection.style.marginBottom = '24px';
  const tldrTitle = document.createElement('h3');
  tldrTitle.textContent = 'TLDR';
  tldrTitle.style.cssText = `
    font-size: 16px;
    margin: 0 0 8px 0;
    font-weight: 600;
    color: #2563eb;
  `;
  const tldrContent = document.createElement('p');
  tldrContent.textContent = response.tldr || 'No TLDR available';
  tldrContent.style.margin = '0';
  tldrSection.appendChild(tldrTitle);
  tldrSection.appendChild(tldrContent);
  container.appendChild(tldrSection);
  
  // Market Impact Section
  const marketSection = document.createElement('section');
  marketSection.style.marginBottom = '24px';
  const marketTitle = document.createElement('h3');
  marketTitle.textContent = 'Market Impact';
  marketTitle.style.cssText = `
    font-size: 16px;
    margin: 0 0 8px 0;
    font-weight: 600;
    color: #2563eb;
  `;
  const marketContent = document.createElement('p');
  marketContent.textContent = response.market_impact || 'No market impact analysis available';
  marketContent.style.margin = '0';
  marketSection.appendChild(marketTitle);
  marketSection.appendChild(marketContent);
  container.appendChild(marketSection);
  
  // Portfolio Impact Section
  const portfolioSection = document.createElement('section');
  const portfolioTitle = document.createElement('h3');
  portfolioTitle.textContent = 'Portfolio Impact';
  portfolioTitle.style.cssText = `
    font-size: 16px;
    margin: 0 0 12px 0;
    font-weight: 600;
    color: #2563eb;
  `;
  
  // Create a list for portfolio impacts
  const portfolioList = document.createElement('ul');
  portfolioList.style.cssText = `
    margin: 0;
    padding: 0;
    list-style: none;
  `;
  
  // Split and create list items
  const impacts = (response.portfolio_impact || 'No portfolio impact analysis available')
    .split('\n')
    .filter(line => line.trim());
  
  impacts.forEach(impact => {
    const li = document.createElement('li');
    li.textContent = impact.trim();
    li.style.cssText = `
      margin-bottom: 8px;
      padding-left: 24px;
      position: relative;
    `;
    
    // Add bullet points based on impact type
    if (impact.includes('✅')) {
      li.style.color = '#059669';  // green
    } else if (impact.includes('⚠️')) {
      li.style.color = '#d97706';  // amber
    } else if (impact.includes('🟰')) {
      li.style.color = '#6b7280';  // gray
    }
    
    portfolioList.appendChild(li);
  });
  
  portfolioSection.appendChild(portfolioTitle);
  portfolioSection.appendChild(portfolioList);
  container.appendChild(portfolioSection);
  
  return container;
}

// Handle the button click
async function handleButtonClick() {
  const modal = showModal();
  
  try {
    // Extract article
    const article = extractArticle();
    console.log('Extracted article:', article);
    
    // Get user's portfolio
    const { tickers = [] } = await chrome.storage.local.get(['tickers']);
    console.log('User tickers:', tickers);
    
    // Prepare the API request
    const prompt = `Act as a financial journalist explaining this news to a beginner investor. Be specific, clear, and concise.

Your response should include:

TLDR:
A 1-2 sentence plain-English summary of the main news.

Market Impact:
Explain how this news affects the broader stock market or specific sectors. Be specific—mention sectors, trends, or ripple effects. Use terms like "bullish," "bearish," or "neutral" where appropriate.

Portfolio Impact:
For each of these stocks: ${tickers.join(', ')}, say one of the following:
- "[TICKER] is directly impacted because [REASON]."
- "[TICKER] may be indirectly impacted due to [REASON]."
- "[TICKER] is likely unaffected because [REASON]."

If no stocks are directly impacted, start with: "No direct portfolio impact detected, but here's the breakdown:"

Keep each explanation to 1 sentence. Do not speculate or offer financial advice. Your tone should be clear, professional, and beginner-friendly.

Article Title: ${article.title}
Article Content: ${article.textContent}`;

    // Get user's auth token
    const { token } = await chrome.storage.local.get(['token']);
    if (!token) {
      throw new Error('Please log in to use PlainSense');
    }

    // Call our secure backend
    const response = await fetch('http://localhost:3000/api/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        article: article.textContent,
        tickers
      })
    });
    
    const data = await response.json();
    
    // Log the raw response
    console.log('API Response:', data);
    
    // Parse the response
    const content = data.choices[0].message.content;
    console.log('Content:', content);

    console.log('Raw API response content:', content);

    // First, try to extract content directly from the API response format
    const directMatches = {
      tldr: content.match(/TLDR:([^]*?)(?=Market Impact:|Portfolio Impact:|$)/i),
      marketImpact: content.match(/Market Impact:([^]*?)(?=Portfolio Impact:|$)/i),
      portfolioImpact: content.match(/Portfolio Impact:([^]*?)(?=$)/i)
    };

    console.log('Direct matches:', directMatches);

    // Extract and clean up the content
    const tldr = directMatches.tldr?.[1]?.trim() || 'No TLDR available';
    const marketImpact = directMatches.marketImpact?.[1]?.trim() || 'No market impact analysis available';
    const portfolioImpact = directMatches.portfolioImpact?.[1]?.trim() || 'No portfolio impact analysis available';

    console.log('Extracted sections:', { tldr, marketImpact, portfolioImpact });
    
    console.log('Parsed sections:', { tldr, marketImpact, portfolioImpact });
    
    // Update modal with formatted response
    const formattedContent = formatResponse({
      tldr,
      market_impact: marketImpact,
      portfolio_impact: portfolioImpact
    });
    
    modal.innerHTML = '';
    modal.appendChild(formattedContent);
    
  } catch (error) {
    console.error('PlainSense Error:', error);
    
    // Create retry button
    const retryButton = document.createElement('button');
    retryButton.textContent = 'Try Again';
    retryButton.style.cssText = `
      background: #2563eb;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 6px;
      font-size: 14px;
      margin-top: 16px;
      cursor: pointer;
    `;
    retryButton.onclick = () => handleButtonClick();

    modal.innerHTML = `
      <div style="padding: 20px;">
        <h2 style="color: #dc2626; margin-bottom: 12px;">Error</h2>
        <p style="color: #4b5563; margin-bottom: 8px;">Sorry, there was an error analyzing this article.</p>
        <p style="color: #6b7280; font-size: 14px; margin-bottom: 16px;">
          ${error.message.includes('API') 
            ? 'There was an issue connecting to our analysis service. Please try again.'
            : error.message}
        </p>
      </div>
    `;
    
    // Add retry button to error message
    modal.querySelector('div').appendChild(retryButton);
  }
}

// Initialize the extension
console.log('PlainSense: Content script loaded');
try {
  injectButton();
  console.log('PlainSense: Button injected successfully');
} catch (error) {
  console.error('PlainSense: Error injecting button:', error);
} 