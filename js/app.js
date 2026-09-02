// Enhanced mobile-friendly app JS with splash screen + PWA support + client-side seed encryption

const tokens = [
  { symbol: 'BTC', name: 'Bitcoin', price: 27563.12 },
  { symbol: 'ETH', name: 'Ethereum', price: 1846.37 },
  { symbol: 'USDT', name: 'Tether', price: 1.00 },
  { symbol: 'USDC', name: 'USD Coin', price: 1.00 },
  { symbol: 'BNB', name: 'Binance Coin', price: 312.55 },
  { symbol: 'ADA', name: 'Cardano', price: 0.38 },
  { symbol: 'SOL', name: 'Solana', price: 21.50 },
  { symbol: 'XRP', name: 'XRP', price: 0.48 },
  { symbol: 'DOT', name: 'Polkadot', price: 6.12 },
  { symbol: 'DOGE', name: 'Dogecoin', price: 0.074 },
  { symbol: 'MATIC', name: 'Polygon', price: 0.85 },
  { symbol: 'SHIB', name: 'Shiba Inu', price: 0.0000084 },
  { symbol: 'LTC', name: 'Litecoin', price: 95.33 },
  { symbol: 'LINK', name: 'Chainlink', price: 7.12 },
  { symbol: 'BCH', name: 'Bitcoin Cash', price: 220.44 },
  { symbol: 'AVAX', name: 'Avalanche', price: 18.02 },
  { symbol: 'TRX', name: 'Tron', price: 0.081 },
  { symbol: 'NEAR', name: 'NEAR', price: 2.58 },
  { symbol: 'ATOM', name: 'Cosmos', price: 10.22 },
  { symbol: 'ALGO', name: 'Algorand', price: 0.16 },
  { symbol: 'FIL', name: 'Filecoin', price: 4.40 },
  { symbol: 'AAVE', name: 'Aave', price: 65.10 },
  { symbol: 'SUSHI', name: 'SushiSwap', price: 1.88 }
];

function rand(min, max){ return Math.random()*(max-min)+min }
function randInt(n){ return Math.floor(Math.random()*n) }
function toHex(len){ let s='';const chars='0123456789abcdef'; for(let i=0;i<len;i++) s+=chars[randInt(chars.length)]; return s }

function generateMnemonic(){
  // improved pseudo-mnemonic (still not BIP39): combine entropy + wordlist
  const wordlist = ['apple','orange','banana','grape','peach','lemon','mango','berry','kiwi','melon','pear','plum','lime','apricot','date','fig','coconut','papaya','guava','nectarine','olive','quince','raisin','currant','cherry']
  const words = []
  // mix crypto API entropy when available
  let entropy = new Uint8Array(16)
  try { window.crypto.getRandomValues(entropy) } catch(e) { for(let i=0;i<16;i++) entropy[i]=Math.floor(Math.random()*256) }
  for(let i=0;i<12;i++){
    const idx = entropy[i] % wordlist.length
    words.push(wordlist[idx])
  }
  return words.join(' ')
}

// Web Crypto helpers (PBKDF2 -> AES-GCM)
async function deriveKey(passphrase, salt){
  const enc = new TextEncoder()
  const passKey = await window.crypto.subtle.importKey('raw', enc.encode(passphrase), {name: 'PBKDF2'}, false, ['deriveKey'])
  const key = await window.crypto.subtle.deriveKey({name:'PBKDF2', salt: salt, iterations: 100000, hash:'SHA-256'}, passKey, {name:'AES-GCM', length:256}, false, ['encrypt','decrypt'])
  return key
}

function buf2b64(b){ return btoa(String.fromCharCode(...new Uint8Array(b))) }
function b642buf(s){ const bin = atob(s); const buf = new Uint8Array(bin.length); for(let i=0;i<bin.length;i++) buf[i]=bin.charCodeAt(i); return buf.buffer }

async function encryptMnemonic(passphrase, mnemonic){
  const enc = new TextEncoder()
  const salt = window.crypto.getRandomValues(new Uint8Array(16))
  const iv = window.crypto.getRandomValues(new Uint8Array(12))
  const key = await deriveKey(passphrase, salt)
  const ct = await window.crypto.subtle.encrypt({name:'AES-GCM', iv}, key, enc.encode(mnemonic))
  return { cipher: buf2b64(ct), salt: buf2b64(salt.buffer), iv: buf2b64(iv.buffer) }
}

async function decryptMnemonic(passphrase, record){
  try{
    const salt = b642buf(record.salt)
    const iv = b642buf(record.iv)
    const key = await deriveKey(passphrase, new Uint8Array(salt))
    const plain = await window.crypto.subtle.decrypt({name:'AES-GCM', iv: new Uint8Array(iv)}, key, b642buf(record.cipher))
    return new TextDecoder().decode(plain)
  }catch(e){ throw new Error('Decryption failed') }
}

function formatCurrency(n){ return Number(n).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2}) }

function loadPortfolio(){
  let stored = localStorage.getItem('exodus.portfolio')
  if(stored) return JSON.parse(stored)
  const base = tokens.map(t=>({ ...t, balance: (rand(0.0001, 12)).toFixed(6) }))
  localStorage.setItem('exodus.portfolio', JSON.stringify(base))
  return base
}

function renderPortfolio(){
  const list = document.getElementById('tokens-list')
  const portfolio = loadPortfolio()
  list.innerHTML = ''
  let total = 0
  portfolio.forEach(t=>{
    const val = parseFloat(t.balance)*t.price
    total += val
    const row = document.createElement('div')
    row.className = 'token-row'
    row.innerHTML = `
      <div class="token-left">
        <div class="token-icon">${t.symbol.slice(0,2)}</div>
        <div>
          <div class="token-name">${t.name} <span style="font-size:12px;color:var(--muted);margin-left:8px">${t.symbol}</span></div>
          <div class="token-balance">${t.balance} • $${formatCurrency(val)}</div>
        </div>
      </div>
      <div style="text-align:right">
        <div style="font-weight:700">$${formatCurrency(val)}</div>
        <div class="small">${t.price.toFixed(4)} / unit</div>
      </div>
    `
    list.appendChild(row)
  })
  document.getElementById('portfolio-total').textContent = '$' + formatCurrency(total)
}

function setAccount(address, mnemonic, encryptedRecord){
  document.getElementById('account-address').textContent = address
  document.getElementById('onboard-status').textContent = address ? 'Wallet ready' : 'No wallet'
  if(!encryptedRecord && mnemonic) localStorage.setItem('exodus.mnemonic', mnemonic)
  if(encryptedRecord) localStorage.setItem('exodus.encrypted', JSON.stringify(encryptedRecord))
  if(address) localStorage.setItem('exodus.address', address)
}

async function createWallet(){
  const mnemonic = generateMnemonic()
  const address = '0x'+toHex(40)
  // ask user if they want to protect seed
  const pass = prompt('Enter a passphrase to protect your seed (leave empty = no passphrase)')
  if(pass && pass.trim().length>0){
    try{
      const record = await encryptMnemonic(pass.trim(), mnemonic)
      setAccount(address, null, record)
      alert('Wallet created and seed encrypted locally. Remember your passphrase.')
    }catch(e){
      alert('Failed to encrypt seed: '+e.message)
      setAccount(address, mnemonic, null)
    }
  } else {
    setAccount(address, mnemonic, null)
    alert('Wallet created and saved locally (unencrypted).')
  }
}

async function importWallet(){
  const m = prompt('Paste your mnemonic (words)')
  if(m && m.trim().split(' ').length>=6){
    const address = '0x'+toHex(40)
    const pass = prompt('Optionally enter a passphrase to encrypt this seed (leave empty = store unencrypted)')
    if(pass && pass.trim().length>0){
      try{
        const record = await encryptMnemonic(pass.trim(), m.trim())
        setAccount(address, null, record)
        alert('Wallet imported and seed encrypted locally')
      }catch(e){ alert('Encryption failed') }
    } else {
      setAccount(address, m.trim(), null)
      alert('Wallet imported (unencrypted)')
    }
  } else {
    alert('Invalid mnemonic')
  }
}

async function showSeed(){
  const encRecord = localStorage.getItem('exodus.encrypted')
  if(encRecord){
    const pass = prompt('Enter passphrase to decrypt your seed')
    if(!pass) return
    try{
      const rec = JSON.parse(encRecord)
      const seed = await decryptMnemonic(pass.trim(), rec)
      alert('Your seed:\n'+seed)
    }catch(e){ alert('Failed to decrypt seed — incorrect passphrase?') }
  } else {
    const seed = localStorage.getItem('exodus.mnemonic')
    if(seed) alert('Your seed:\n'+seed)
    else alert('No seed stored')
  }
}

function resetDemo(){
  if(!confirm('Reset demo and clear local data?')) return
  localStorage.clear()
  location.reload()
}

function hideSplash(){
  const splash = document.getElementById('splash')
  const app = document.getElementById('app')
  if(splash){
    splash.style.transition = 'opacity 300ms ease'
    splash.style.opacity = '0'
    setTimeout(()=>{ splash.style.display='none'; app.style.display='block'; }, 350)
  } else {
    app.style.display='block'
  }
}

function init(){
  // wire buttons
  document.getElementById('create-wallet').addEventListener('click', () => { createWallet().then(renderPortfolio) })
  document.getElementById('import-wallet').addEventListener('click', () => { importWallet().then(renderPortfolio) })
  document.getElementById('reset-btn').addEventListener('click', resetDemo)
  document.getElementById('swap-btn').addEventListener('click', ()=>alert('Swap functionality not connected'))
  document.getElementById('receive-btn').addEventListener('click', ()=>{
    const addr = localStorage.getItem('exodus.address') || '— not created —'
    alert('Receive address:\n'+addr)
  })
  document.getElementById('show-seed-btn').addEventListener('click', () => { showSeed() })

  const storedAddr = localStorage.getItem('exodus.address')
  const storedMnemonic = localStorage.getItem('exodus.mnemonic')
  if(storedAddr) setAccount(storedAddr, storedMnemonic, null)
  renderPortfolio()

  // small UX: hide splash after assets ready
  setTimeout(hideSplash, 800)
}

window.addEventListener('DOMContentLoaded', init)
