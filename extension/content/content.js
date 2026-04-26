chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.action !== "scrape") return;

  const getMeta = (selector) => {
    return document.querySelector(selector)?.getAttribute("content")?.trim() ?? null;
  };

  const hostname = window.location.hostname;

  let sourceType = "manual";
  if (hostname.includes("reddit.com")) sourceType = "reddit";
  else if (hostname.includes("linkedin.com")) sourceType = "linkedin";

  const ogTitle = getMeta('meta[property="og:title"]');
  const ogDescription = getMeta('meta[property="og:description"]');
  const ogImage = getMeta('meta[property="og:image"]');
  const selectedText = window.getSelection()?.toString()?.trim() ?? "";

  const bodyText = (document.body?.innerText ?? "").slice(0, 3000);

  sendResponse({
    url: window.location.href,
    title: ogTitle || document.title || null,
    og_description: ogDescription,
    og_image: ogImage,
    selected_text: selectedText,
    body_text: bodyText,
    source_type: sourceType,
    excerpt: ogDescription || selectedText || null
  });

  // Return true keeps the message channel open (required for async sendResponse)
  return true;
});
