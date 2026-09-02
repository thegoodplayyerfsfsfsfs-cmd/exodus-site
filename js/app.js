// app.js v3: live prices, slider, token picker, swap animations

const TOKENS = [
  { symbol: 'BTC', name: 'Bitcoin', coingecko: 'bitcoin', icon: '₿' },
  { symbol: 'ETH', name: 'Ethereum', coingecko: 'ethereum', icon: 'Ξ' },
  { symbol: 'USDT', name: 'Tether', coingecko: 'tether', icon: '$' },
  { symbol: 'USDC', name: 'USD Coin', coingecko: 'usd-coin', icon: '$' },
  { symbol: 'BNB', name: 'BNB', coingecko: 'binancecoin', icon: 'B' },
  { symbol: 'MATIC', name: 'Polygon', coingecko: 'matic-network', icon: 'M' },
  { symbol: 'SOL', name: 'Solana', coingecko: 'solana', icon: 'S' },
  { symbol: 'ADA', name: 'Cardano', coingecko: 'cardano', icon: 'A' },
  { symbol: 'DOGE', name: 'Dogecoin', coingecko: 'dogecoin', icon: 'Ð' },
  { symbol: 'DOT', name: 'Polkadot', coingecko: 'polkadot', icon: 'P' }
]

let state = {
  from: TOKENS[0],
  to: TOKENS[1],
  usd: 0,
  sliderValue: 0.02, // 0..1 mapped to 50..500 by default
  mode: 'buy',
  prices: {},
}

// Utility
const $ = s => document.querySelector(s)
const $$ = s => Array.from(document.querySelectorAll(s))
function formatCurrency(n){ return Number(n).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2}) }

async function fetchPrices(){
  try{
    const ids = TOKENS.map(t=>t.coingecko).join(',')
    const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd`)
    const data = await res.json()
    TOKENS.forEach(t=>{ state.prices[t.symbol] = data[t.coingecko] ? data[t.coingecko].usd : 0 })
  }catch(e){ console.warn('Price fetch failed',e); TOKENS.forEach(t=>state.prices[t.symbol]=t.fallback||0) }
}

function updateAmounts(){
  const usd = state.usd
  const fromPrice = state.prices[state.from.symbol] || 1
  const toPrice = state.prices[state.to.symbol] || 1
  const receive = toPrice>0 ? (usd / toPrice) : 0
  $('#usd-amount').textContent = formatCurrency(usd)
  $('#receive-amount').textContent = formatCurrency(receive)
  $('#top-balance').textContent = `I have 0 ${state.from.name}`
  $('#top-amount').textContent = `0 ${state.from.symbol}`
  // update bottom icons
  $('#left-coin').textContent = state.from.icon
  $('#right-coin').textContent = state.to.icon
  $('#from-symbol').innerHTML = `${state.from.symbol} <span class="caret">▾</span>`
  $('#to-symbol').innerHTML = `${state.to.symbol} <span class="caret">▾</span>`
  $('#from-icon').textContent = state.from.icon
  $('#to-icon').textContent = state.to.icon
}

function mapSliderToUSD(v){
  // map 0..1 to 50..500 with easing (exponential feel)
  const min = 50, max = 500
  const val = min + Math.pow(v,1.4)*(max-min)
  return Math.round(val)
}

function setSliderPositionByValue(v){
  const knob = $('#knob')
  const slider = document.getElementById('curve-slider')
  const rect = slider.getBoundingClientRect()
  const x = rect.left + 0.06*rect.width + v*(rect.width*0.88)
  knob.style.left = `${((x-rect.left)/rect.width)*100}%`
  knob.setAttribute('aria-valuenow', mapSliderToUSD(v))
}

function initSlider(){
  const knob = $('#knob')
  const slider = document.getElementById('curve-slider')
  function updateFromPos(clientX){
    const rect = slider.getBoundingClientRect()
    let x = clientX - rect.left
    const pct = Math.max(0, Math.min(1, (x - rect.width*0.06) / (rect.width*0.88)))
    state.sliderValue = pct
    state.usd = mapSliderToUSD(pct)
    setSliderPositionByValue(pct)
    updateAmounts()
  }
  let dragging = false
  ;['touchstart','mousedown'].forEach(ev=> slider.addEventListener(ev, e=>{
    dragging = true
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    updateFromPos(clientX)
  }))
  ;['touchmove','mousemove'].forEach(ev=> window.addEventListener(ev, e=>{
    if(!dragging) return
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    updateFromPos(clientX)
  }))
  ;['touchend','mouseup','mouseleave'].forEach(ev=> window.addEventListener(ev, ()=>{ dragging=false }))
  // init
  setSliderPositionByValue(state.sliderValue)
  state.usd = mapSliderToUSD(state.sliderValue)
}

function openTokenModal(side){
  const modal = $('#token-modal')
  modal.setAttribute('aria-hidden','false')
  const list = $('#token-list')
  list.innerHTML = ''
  TOKENS.forEach(t=>{
    const el = document.createElement('div')
    el.className='token-item'
    el.innerHTML = `<div class="token-icon" style="width:36px;height:36px;border-radius:8px;background:linear-gradient(135deg,var(--accent1),var(--accent2));display:flex;align-items:center;justify-content:center">${t.icon}</div><div style="flex:1"><div style="font-weight:700">${t.symbol}</div><div class="small">${t.name}</div></div>`
    el.addEventListener('click', ()=>{
      if(side==='from'){ state.from = t } else { state.to = t }
      modal.setAttribute('aria-hidden','true')
      updateAmounts()
    })
    list.appendChild(el)
  })
}

function initTokenPicker(){
  $('#from-pill').addEventListener('click', ()=> openTokenModal('from'))
  $('#to-pill').addEventListener('click', ()=> openTokenModal('to'))
  $('#close-modal').addEventListener('click', ()=> $('#token-modal').setAttribute('aria-hidden','true'))
  $('#token-search').addEventListener('input', (e)=>{
    const q = e.target.value.toLowerCase()
    const list = $('#token-list')
    list.innerHTML = ''
    TOKENS.filter(t=> t.name.toLowerCase().includes(q) || t.symbol.toLowerCase().includes(q)).forEach(t=>{
      const el = document.createElement('div')
      el.className='token-item'
      el.innerHTML = `<div class="token-icon" style="width:36px;height:36px;border-radius:8px;background:linear-gradient(135deg,var(--accent1),var(--accent2));display:flex;align-items:center;justify-content:center">${t.icon}</div><div style="flex:1"><div style="font-weight:700">${t.symbol}</div><div class="small">${t.name}</div></div>`
      el.addEventListener('click', ()=>{ state.to = t; $('#token-modal').setAttribute('aria-hidden','true'); updateAmounts() })
      list.appendChild(el)
    })
  })
}

function initMinMax(){
  $('#min-btn').addEventListener('click', ()=>{ state.sliderValue = 0; state.usd = mapSliderToUSD(0); setSliderPositionByValue(0); updateAmounts() })
  $('#max-btn').addEventListener('click', ()=>{ state.sliderValue = 1; state.usd = mapSliderToUSD(1); setSliderPositionByValue(1); updateAmounts() })
}

function initSwapCenter(){
  $('#swap-center').addEventListener('click', ()=>{
    const btn = $('#swap-center')
    btn.animate([{transform:'rotate(0deg)'},{transform:'rotate(180deg)'}],{duration:420,fill:'forwards'})
    // swap tokens
    const tmp = state.from; state.from = state.to; state.to = tmp
    // animate bottom pill pulse
    $('#bottom-pill').animate([{transform:'scale(1)'},{transform:'scale(1.03)'},{transform:'scale(1)'}],{duration:360})
    updateAmounts()
  })
}

function initSegControl(){
  $$('.seg').forEach(b=> b.addEventListener('click', e=>{
    $$('.seg').forEach(x=>x.classList.remove('active'))
    e.currentTarget.classList.add('active')
    state.mode = e.currentTarget.dataset.mode
    // slight visual change
    $('#notice').textContent = state.mode==='buy' ? 'Buying via third-party providers' : 'Selling via third-party providers'
  }))
}

async function init(){
  await fetchPrices()
  initSlider()
  initTokenPicker()
  initMinMax()
  initSwapCenter()
  initSegControl()
  updateAmounts()
  // hide splash
  const splash = document.getElementById('splash')
  const app = document.getElementById('app')
  setTimeout(()=>{ if(splash){ splash.style.transition='opacity 300ms'; splash.style.opacity='0'; setTimeout(()=>{splash.style.display='none'; app.style.display='block'},350)} else app.style.display='block' }, 600)
  // refresh prices periodically
  setInterval(async ()=>{ await fetchPrices(); updateAmounts() }, 30000)
}

window.addEventListener('DOMContentLoaded', init)
