const translations = {
  en: {
    title: 'Kapruka Shopping Agent',
    welcome: 'Ayubowan! Welcome to Kapruka Shopping Agent. What can I help you find today?',
    placeholder: "Type your message... (e.g., 'Find flowers', 'Search electronics')",
    send: 'Send',
    cart: 'Cart',
    checkout: 'Checkout',
    close: 'Close',
    added_to_cart: 'Added {name} to your cart!',
    delivery_confirmed: 'Delivery to {city} on {date}: confirmed!',
    product_details: '{name}\nPrice: LKR {price}\n{desc}',
    product_details_fallback: '{name}\nPrice: LKR {price}\nTap "View Details" in the product card for more info.',
    track_result: 'Order {order} status: {status}',
    track_error: 'Could not track that order. Please check the number and try again.',
    error_default: "Sorry — something broke on my end. Try again and I'll do better next time.",
  },
  si: {
    title: 'Kapruka Agent',
    welcome: 'ආයුබෝවන්! මම ඔබට මොනවද හොයන්න උදව් කරනවද?',
    placeholder: "ඔබගේ පණිවිඩය ටයිප් කරන්න... (උදා: 'මල් සෙවීම', 'ඇසුරුම් සෙවීම')",
    send: 'යවන්න',
    cart: 'බඩු මණ්ඩලය',
    checkout: 'ගෙවීම',
    close: 'වසා දැමීමට',
    added_to_cart: '{name} බඩු මණ්ඩලයට එකතු කරන ලදී!',
    delivery_confirmed: '{city} වෙත {date} දිනට බෙදාහැරීම සාර්ථකයි!',
    product_details: '{name}\nමිල: LKR {price}\n{desc}',
    product_details_fallback: '{name}\nමිල: LKR {price}\nතව විස්තර සඳහා නිෂ්පාත කාඩ් එකේ "View Details" ක්ලික් කරන්න.',
    track_result: 'ඇඳුම් {order} තත්ත්වය: {status}',
    track_error: 'මෙම ඇඳුම් අංකය සොයාගත නොහැක. අංකය පරීක්ෂා කර නැවත උත්සාහ කරන්න.',
    error_default: 'සමාවෙන්න — දොරටුගේ ගැටලුවක්. නැවත උත්සාහ කරන්න.',
  },
  ta: {
    title: 'Kapruka Shopping Agent',
    welcome: 'Hey machan! What you need today? I can find anything for you.',
    placeholder: "Type your message... (e.g., 'Flowers', 'Electronics under 10k')",
    send: 'Send',
    cart: 'Cart',
    checkout: 'Checkout',
    close: 'Close',
    added_to_cart: '{name} cart la add panniyachu da! 🛒',
    delivery_confirmed: '{city} ku {date} delivery confirm aaitu irruku!',
    product_details: '{name}\nPrice: LKR {price}\n{desc}',
    product_details_fallback: '{name}\nPrice: LKR {price}\nMore info kaanga product card la "View Details" click pannu.',
    track_result: 'Order {order} status: {status}',
    track_error: 'Order number waste da, check pannu nga try again!',
    error_default: 'Aiyo appa error poochu — thirumba try pannu machan!',
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

export const availableLocales = ['en', 'si', 'ta']
