(() => {
    if (window !== window.top || location.hash !== '#/tray') return;

    const link = document.createElement('a');
    link.href = location.href;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.style.cssText = 'align-self:center;padding:9px 12px;color:inherit;font-size:14px;text-decoration:underline';

    // Keep the original node for Svelte to manage when the account state changes.
    function syncLink() {
        const button = document.querySelector('.tray button.t-signin');
        if (!button) {
            link.remove();
            return;
        }
        const caption = /^ru\b/i.test(document.documentElement.lang) || /[А-Яа-яЁё]/.test(button.textContent)
            ? 'Войти в браузере' : 'Sign in in your browser';
        if (link.textContent !== caption) link.textContent = caption;
        if (link.nextElementSibling !== button) button.before(link);
        if (!button.hidden) button.hidden = true;
    }

    window.addEventListener('DOMContentLoaded', () => {
        const root = document.querySelector('#app') || document.body;
        new MutationObserver(syncLink).observe(root, { childList: true, subtree: true, characterData: true });
        syncLink();
    }, { once: true });
})();
