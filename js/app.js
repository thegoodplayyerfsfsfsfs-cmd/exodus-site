// Enhanced mobile-friendly app JS with splash screen + PWA support

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

function setAccount(address, mnemonic){
  document.getElementById('account-address').textContent = address
  document.getElementById('onboard-status').textContent = address ? 'Wallet ready' : 'No wallet'
  if(mnemonic) localStorage.setItem('exodus.mnemonic', mnemonic)
  if(address) localStorage.setItem('exodus.address', address)
}

function createWallet(){
  const mnemonic = generateMnemonic()
  const address = '0x'+toHex(40)
  setAccount(address, mnemonic)
  alert('Wallet created and saved locally')
}

function importWallet(){
  const m = prompt('Paste your mnemonic (words)')
  if(m && m.trim().split(' ').length>=6){
    const address = '0x'+toHex(40)
    setAccount(address, m.trim())
    alert('Wallet imported')
  } else {
    alert('Invalid mnemonic')
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
  document.getElementById('create-wallet').addEventListener('click', createWallet)
  document.getElementById('import-wallet').addEventListener('click', importWallet)
  document.getElementById('reset-btn').addEventListener('click', resetDemo)
  document.getElementById('swap-btn').addEventListener('click', ()=>alert('Swap functionality not connected'))
  document.getElementById('receive-btn').addEventListener('click', ()=>{
    const addr = localStorage.getItem('exodus.address') || '— not created —'
    alert('Receive address:\n'+addr)
  })

  const storedAddr = localStorage.getItem('exodus.address')
  const storedMnemonic = localStorage.getItem('exodus.mnemonic')
  if(storedAddr) setAccount(storedAddr, storedMnemonic)
  renderPortfolio()

  // small UX: hide splash after assets ready
  setTimeout(hideSplash, 800)
}

window.addEventListener('DOMContentLoaded', init)
