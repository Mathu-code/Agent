const translations = {
  en: {
    title: '🛍️ Kapruka Shopping Agent',
    welcome: 'Ayubowan! 👋 Welcome to Kapruka Shopping Agent. What can I help you find today?',
    placeholder: "Type your message... (e.g., 'Find flowers', 'Search electronics')",
    send: 'Send',
    cart: 'Cart',
    checkout: 'Checkout',
    close: 'Close'
  },
  si: {
    title: '🛍️ Kapruka සාප්පු ඒජන්තය',
    welcome: 'ආයුබෝවන්! 👋 හැමෝටම ස්‍වාගතයි. මම ඔබට මොනවද හොයන්න උදව් කරනවද?',
    placeholder: "ඔබගේ පණිවිඩය ටයිප් කරන්න... (උදා: 'මල් සෙවීම', 'ඇසුරුම් සෙවීම')",
    send: 'යවන්න',
    cart: 'දෙපාර්තමේන්තුව',
    checkout: 'පරීක්ෂණය',
    close: 'වසා දැමීමට'
  }
}

export function t(locale, key, vars) {
  const lang = translations[locale] ? locale : 'en'
  let str = (translations[lang] && translations[lang][key]) || (translations['en'] && translations['en'][key]) || key
  if (vars) {
    Object.keys(vars).forEach(k => {
      const re = new RegExp(`\\{${k}\\}`, 'g')
      str = str.replace(re, vars[k])
    })
  }
  return str
}

export const availableLocales = ['en', 'si']
