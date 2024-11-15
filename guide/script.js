// Converts markdown to HTML, processing various markdown elements like headers, lists, and images
function markdownToHTML(md) {
    let html = md
        .replace(/```([^\n`]+)```/gim, '<mark>$1</mark>')
        // Process headers (h1 - h6)
        .replace(/^###### (.*$)/gim, '<h6>$1</h6>')
        .replace(/^##### (.*$)/gim, '<h5>$1</h5>')
        .replace(/^#### (.*$)/gim, '<h4>$1</h4>')
        .replace(/^### (.*$)/gim, '<h3>$1</h3>')
        .replace(/^## (.*$)/gim, '<h2>$1</h2>')
        .replace(/^# (.*$)/gim, '<h1>$1</h1>')
        // Process bold text
        .replace(/\*\*([^*]+)\*\*/gim, '<strong>$1</strong>')
        // Process italic text
        .replace(/\*([^*]+)\*/gim, '<em>$1</em>')
        // Process images with description
        .replace(/\!\[([^\]]+)\]\(([^)]+)\)/gim, (match, p1, p2) => {
            return `<div style="text-align: center;" class="content"><img src="${p2}" alt="${p1}"><span class="image-description">${p1}</span></div>`;
        })
        // Process links
        .replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2">$1</a>')
        // Process unordered list items
        .replace(/^\- (.*$)/gim, '<li>$1</li>')
        // Process ordered list items
        .replace(/^\d+\.\s(.*$)/gim, '<li>$1</li>') // Adicionando suporte para listas numeradas
        // Wrap list items into <ol> and <ul>
        .replace(/(?:^|\n)(\d+\.\s.*)(?=\n)/gim, '<ol><li>$1</li></ol>') // Wrap lists in <ol>
        .replace(/(?:^|\n)\-.*(?=\n)/gim, '<ul><li>$1</li></ul>') // Wrap unordered lists in <ul>
        // Process custom tags for important notes, tips, warnings, etc.
        .replace(/```IMPORTANT([\s\S]+?)```/gim, '<div class="quote-card quote-important" style="background-color: #f9f2f4; border-left: 5px solid #e31a1c; padding: 15px; margin: 10px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); border-radius: 8px;"><h3 style="color: #e31a1c;">Important</h3><p>$1</p></div>')
        .replace(/```NOTE([\s\S]+?)```/gim, '<div class="quote-card quote-note"<h3>Note</h3><p>$1</p></div>')
        .replace(/```TIP([\s\S]+?)```/gim, '<div class="quote-card quote-tip" style="background-color: #e2f9e2; border-left: 5px solid #28a745; padding: 15px; margin: 10px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); border-radius: 8px;"><h3 style="color: #28a745;">Tip</h3><p>$1</p></div>')
        .replace(/```WARN([\s\S]+?)```/gim, '<div class="quote-card quote-warning" style="background-color: #fff3cd; border-left: 5px solid #ffc107; padding: 15px; margin: 10px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); border-radius: 8px;"><h3 style="color: #ffc107;">Warning</h3><p>$1</p></div>')
        .replace(/```CARD([\s\S]+?)```/gim, '<div class="quote-card quote-default" style="background-color: #ffffff; border-left: 5px solid #ddd; padding: 15px; margin: 10px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); border-radius: 8px;"><p>$1</p></div>')
        .replace(/```([\s\S]+?)```/gim, (match, p1) => {
            const trimmedCode = p1.trim();
            return `<div class="code-block"><button class="copy-button">Copy</button><pre><code>${trimmedCode}</code></pre></div>`;
        })
        // Replace line breaks
        .replace(/(\n)/g, '<br>')
    return html;
}

// Loads a markdown post from the query string and converts it to HTML
function loadPost() {
    const urlParams = new URLSearchParams(window.location.search);
    const fileName = urlParams.get('post');

    if (fileName) {
        fetch(`./guide/posts/${fileName}.md`)
            .then(response => {
                if (!response.ok) {
                    window.location.href = "404.html";
                    throw new Error("File not found.");
                }
                return response.text();
            })
            .then(md => {
                const authorInfo = extractAuthorInfo(md);
                const postHTML = markdownToHTML(md.replace(/Info {[^}]+}/, '')); // Remove author info from markdown
                const postContainer = document.getElementById('post-content');
                const postDate = getFileDate(`./guide/posts/${fileName}.md`);

                // Add author info to the post
                let authorHTML = '';
                // Only add author information if it's not "Unknown"
                if (authorInfo.name !== 'Unknown') {
                    authorHTML = `
                        <div class="author-info">
                            <img src="${authorInfo.photo}" alt="${authorInfo.name}">
                            <span>By <a href="${authorInfo.profileUrl}">${authorInfo.name}</a></span>
                        </div>
                    `;
                }

                postContainer.innerHTML = `
                    <article>
                        <h1>${fileName.replace(/-/g, ' ').replace(/\b\w/g, char => char.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase())}</h1>
                        ${authorHTML} <!-- Only show author info if it's not "Unknown" -->
                        <p class="post-meta">Article published on ${postDate}</p>
                        <div>${postHTML}</div>
                    </article>
                `;

                addCopyButtonEventListeners();
                document.querySelector('body').classList.add('loaded');
            })
            .catch(error => console.log('Error loading post:', error));
    } else {
        window.location.href = "404.html";
    }
}

// Adds event listeners to all code block copy buttons
function addCopyButtonEventListeners() {
    const copyButtons = document.querySelectorAll('.copy-button');
    copyButtons.forEach(button => {
        button.addEventListener('click', function() {
            const code = button.nextElementSibling.innerText;
            navigator.clipboard.writeText(code)
                .then(() => {
                    button.innerText = 'Copied!';
                    setTimeout(() => {
                        button.innerText = 'Copy';
                    }, 1500);
                })
                .catch(() => alert('Error copying code'));
        });
    });
}

// Summarizes the article text (first two sentences)
function summarizeText(content) {
    const sentences = content.split(". ");
    const summary = sentences.slice(0, 2).join(". ") + (sentences.length > 2 ? "." : "");
    return summary;
}

// Toggles summary visibility when button is clicked
document.getElementById("summarizeButton").addEventListener("click", function() {
    const postContent = document.getElementById("post-content");
    const summaryContainer = postContent.querySelector(".summary-container");

    if (summaryContainer) {
        summaryContainer.classList.toggle('show'); // Toggle the 'show' class to hide or show
    } else {
        const articleContent = postContent.querySelector("article").innerText;
        const summary = summarizeText(articleContent);

        const summaryContainer = document.createElement("div");
        summaryContainer.classList.add("summary-container");
        summaryContainer.innerHTML = `
            <h4>
                <img src="./icon/ic_sum.svg" alt="Summary">
                Summary
            </h4>
            <h5>Text summary</h5>
            <p>${summary}</p>
            <p class="auto-note">*Summary generated automatically.</p>
        `;

        postContent.prepend(summaryContainer);
        window.scrollTo({
            top: summaryContainer.offsetTop - 10,
            behavior: 'smooth'
        });

        setTimeout(() => summaryContainer.classList.add('show'), 100);
    }
});

// Extracts author information from markdown metadata
function extractAuthorInfo(md) {
    const authorMatch = md.match(/Info {\s*AuthorName: ([^\n]+)\s*AuthorUrlProfile: ([^\n]+)\s*AuthorPhoto: ([^\n]+)\s*}/);
    return authorMatch ? {
        name: authorMatch[1].trim(),
        profileUrl: authorMatch[2].trim(),
        photo: authorMatch[3].trim()
    } : {
        name: 'Unknown',
        profileUrl: '#',
        photo: '' // Empty photo URL when author is unknown
    };
}

// Returns the current file's date (using mock date for now)
function getFileDate(filePath) {
    return new Date().toLocaleDateString();
}

// Handles toolbar visibility based on scroll position
document.addEventListener('DOMContentLoaded', () => {
    const toolbar = document.querySelector('.t');

    // Updates the toolbar's class based on scroll position
    function updateToolbar() {
        toolbar.classList.toggle('scrolled', window.scrollY > 10);
    }

    window.addEventListener('scroll', updateToolbar);
});

// Initializes post loading when the page is ready
loadPost();
