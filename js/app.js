// app.js v5: improved knob physics, confirm/history modals, vibration feedback

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
  balances: {},
}

const $ = s => document.querySelector(s)
const $$ = s => Array.from(document.querySelectorAll(s))
function formatCurrency(n){ return Number(n).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2}) }

function vibrate(ms){ if(navigator.vibrate) navigator.vibrate(ms) }

function initBalances(){
  const stored = localStorage.getItem('exodus.balances')
  if(stored){ state.balances = JSON.parse(stored); return }
  TOKENS.forEach(t=>{ state.balances[t.symbol] = (Math.random()*3 + 0.1).toFixed(6) })
  localStorage.setItem('exodus.balances', JSON.stringify(state.balances))
}

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
  const fromBal = parseFloat(state.balances[state.from.symbol] || 0)
  $('#top-balance').textContent = `I have ${formatCurrency(fromBal)} ${state.from.name}`
  $('#top-amount').textContent = `${fromBal.toFixed(6)} ${state.from.symbol}`
  $('#left-coin').textContent = state.from.icon
  $('#right-coin').textContent = state.to.icon
  $('#from-symbol').innerHTML = `${state.from.symbol} <span class="caret">▾</span>`
  $('#to-symbol').innerHTML = `${state.to.symbol} <span class="caret">▾</span>`
  $('#from-icon').textContent = state.from.icon
  $('#to-icon').textContent = state.to.icon
}

function saveBalances(){ localStorage.setItem('exodus.balances', JSON.stringify(state.balances)) }

function mapSliderToUSD(v){ const min = 50, max = 500; const val = min + Math.pow(v,1.4)*(max-min); return Math.round(val) }

function setSliderPositionByValue(v){
  const knob = $('#knob')
  const slider = document.getElementById('curve-slider')
  const rect = slider.getBoundingClientRect()
  const x = rect.left + 0.06*rect.width + v*(rect.width*0.88)
  knob.style.left = `${((x-rect.left)/rect.width)*100}%`
  knob.setAttribute('aria-valuenow', mapSliderToUSD(v))
}

// Simple animation helper
function animateValue(from, to, duration, onUpdate, onComplete){
  const start = performance.now()
  function frame(now){
    const t = Math.min(1, (now-start)/duration)
    const eased = 1 - Math.pow(1-t,3) // easeOutCubic
    const val = from + (to-from)*eased
    onUpdate(val)
    if(t<1) requestAnimationFrame(frame); else onComplete && onComplete()
  }
  requestAnimationFrame(frame)
}

function initSlider(){
  const knob = $('#knob')
  const slider = document.getElementById('curve-slider')
  let dragging = false
  let lastX = 0, lastT = 0, prevX = 0, prevT = 0

  function updateFromPos(clientX){
    const rect = slider.getBoundingClientRect()
    let x = clientX - rect.left
    const pct = Math.max(0, Math.min(1, (x - rect.width*0.06) / (rect.width*0.88)))
    state.sliderValue = pct
    state.usd = mapSliderToUSD(pct)
    setSliderPositionByValue(pct)
    updateAmounts()
  }

  ;['touchstart','mousedown'].forEach(ev=> slider.addEventListener(ev, e=>{
    dragging = true
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    prevX = clientX; prevT = performance.now(); lastX = clientX; lastT = prevT
    updateFromPos(clientX)
    vibrate(10)
  }))

  ;['touchmove','mousemove'].forEach(ev=> window.addEventListener(ev, e=>{
    if(!dragging) return
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    // track velocity
    prevX = lastX; prevT = lastT; lastX = clientX; lastT = performance.now()
    updateFromPos(clientX)
  }))

  ;['touchend','mouseup','mouseleave'].forEach(ev=> window.addEventListener(ev, ()=>{
    if(!dragging) return
    dragging = false
    // compute velocity
    const dt = (lastT - prevT) || 1
    const vx = (lastX - prevX)/dt
    // if velocity significant, fling
    let target = state.sliderValue
    if(Math.abs(vx) > 0.25){ target = Math.max(0, Math.min(1, state.sliderValue + vx*120)) }
    // snap to bounds if near
    if(target < 0.03) target = 0
    if(target > 0.97) target = 1
    // animate to target
    animateValue(state.sliderValue, target, 360, v=>{
      state.sliderValue = v
      state.usd = mapSliderToUSD(v)
      setSliderPositionByValue(v)
      updateAmounts()
    }, ()=> vibrate(20))
  }))

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
    el.setAttribute('role','listitem')
    el.innerHTML = `<div class="token-icon" style="width:36px;height:36px;border-radius:8px;background:linear-gradient(135deg,var(--accent1),var(--accent2));display:flex;align-items:center;justify-content:center">${t.icon}</div><div style="flex:1"><div style="font-weight:700">${t.symbol}</div><div class="small">${t.name}</div></div>`
    el.addEventListener('click', ()=>{
      if(side==='from'){ state.from = t } else { state.to = t }
      modal.setAttribute('aria-hidden','true')
      updateAmounts()
      vibrate(15)
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
      el.addEventListener('click', ()=>{ state.to = t; $('#token-modal').setAttribute('aria-hidden','true'); updateAmounts(); vibrate(15) })
      list.appendChild(el)
    })
  })
}

function initMinMax(){
  $('#min-btn').addEventListener('click', ()=>{ animateValue(state.sliderValue, 0, 300, v=>{ state.sliderValue=v; state.usd=mapSliderToUSD(v); setSliderPositionByValue(v); updateAmounts() }) })
  $('#max-btn').addEventListener('click', ()=>{ animateValue(state.sliderValue, 1, 300, v=>{ state.sliderValue=v; state.usd=mapSliderToUSD(v); setSliderPositionByValue(v); updateAmounts() }) })
}

function saveTransaction(tx){ const hist = JSON.parse(localStorage.getItem('exodus.history') || '[]'); hist.unshift(tx); localStorage.setItem('exodus.history', JSON.stringify(hist.slice(0,50))) }

function openConfirmModal(){
  const modal = $('#confirm-modal')
  const body = $('#confirm-body')
  const usd = state.usd
  const fromPrice = state.prices[state.from.symbol] || 1
  const toPrice = state.prices[state.to.symbol] || 1
  const fromAmount = usd / fromPrice
  const toAmount = usd / toPrice
  body.innerHTML = `
    <div><strong>${state.mode === 'buy' ? 'Buying' : 'Selling'} ${state.to.symbol}</strong></div>
    <div style="margin-top:6px">From: ${fromAmount.toFixed(6)} ${state.from.symbol}</div>
    <div>To: ${toAmount.toFixed(6)} ${state.to.symbol}</div>
    <div class="meta" style="margin-top:8px;color:var(--muted)">Estimated network fee: simulated</div>
  `
  modal.setAttribute('aria-hidden','false')
  vibrate(20)
}

function closeConfirmModal(){ $('#confirm-modal').setAttribute('aria-hidden','true') }

function performSimulatedSwap(){
  const usd = state.usd
  const fromPrice = state.prices[state.from.symbol] || 1
  const toPrice = state.prices[state.to.symbol] || 1
  const fromAmount = usd / fromPrice
  const toAmount = usd / toPrice
  const currentFromBal = parseFloat(state.balances[state.from.symbol] || 0)
  if(currentFromBal + 1e-12 < fromAmount){ alert('Insufficient balance for this swap'); return }
  state.balances[state.from.symbol] = Math.max(0, currentFromBal - fromAmount)
  state.balances[state.to.symbol] = parseFloat((parseFloat(state.balances[state.to.symbol]||0) + toAmount).toFixed(6))
  saveBalances()
  const tx = { time: Date.now(), from: state.from.symbol, to: state.to.symbol, usd, fromAmount, toAmount }
  saveTransaction(tx)
  $('#bottom-pill').animate([{transform:'translateY(0)'},{transform:'translateY(-8px)'},{transform:'translateY(0)'}],{duration:420})
  vibrate([20,40,20])
  // show receipt modal briefly
  closeConfirmModal()
  showReceipt(tx)
  updateAmounts()
}

function showReceipt(tx){
  const modal = $('#confirm-modal')
  const body = $('#confirm-body')
  body.innerHTML = `<div style="font-weight:800">Swap complete</div><div style="margin-top:8px">${formatCurrency(tx.usd)} → ${tx.toAmount.toFixed(6)} ${tx.to}</div><div class="meta">Tx simulated • ${new Date(tx.time).toLocaleString()}</div>`
  modal.setAttribute('aria-hidden','false')
  // auto-close in 2.5s
  setTimeout(()=>{ modal.setAttribute('aria-hidden','true') }, 2500)
}

function initBottomSwap(){
  $('#bottom-pill').addEventListener('click', ()=> openConfirmModal())
  $('#confirm-cancel').addEventListener('click', ()=> closeConfirmModal())
  $('#confirm-ok').addEventListener('click', ()=> performSimulatedSwap())
}

function showHistoryModal(){
  const hist = JSON.parse(localStorage.getItem('exodus.history') || '[]')
  const list = $('#history-list')
  list.innerHTML = ''
  if(hist.length===0){ list.innerHTML = '<div class="small">No transactions yet</div>' }
  hist.slice(0,50).forEach(h=>{
    const el = document.createElement('div')
    el.className = 'history-item'
    el.innerHTML = `<div style="font-weight:700">${h.from} → ${h.to} • ${formatCurrency(h.usd)} USD</div><div class="meta">${new Date(h.time).toLocaleString()}</div><div style="margin-top:6px">${h.fromAmount.toFixed(6)} → ${h.toAmount.toFixed(6)}</div>`
    list.appendChild(el)
  })
  $('#history-modal').setAttribute('aria-hidden','false')
}

function initHistory(){
  $('#back-btn').addEventListener('click', ()=> showHistoryModal())
  $('#close-history').addEventListener('click', ()=> $('#history-modal').setAttribute('aria-hidden','true'))
}

function initSwapCenter(){
  $('#swap-center').addEventListener('click', ()=>{
    const btn = $('#swap-center')
    btn.animate([{transform:'rotate(0deg)'},{transform:'rotate(180deg)'}],{duration:420,fill:'forwards'})
    const tmp = state.from; state.from = state.to; state.to = tmp
    $('#bottom-pill').animate([{transform:'scale(1)'},{transform:'scale(1.03)'},{transform:'scale(1)'}],{duration:360})
    updateAmounts()
    vibrate(15)
  })
}

function initSegControl(){
  $$('.seg').forEach(b=> b.addEventListener('click', e=>{
    $$('.seg').forEach(x=>x.classList.remove('active'))
    e.currentTarget.classList.add('active')
    state.mode = e.currentTarget.dataset.mode
    $('#notice').textContent = state.mode==='buy' ? 'Buying via third-party providers' : 'Selling via third-party providers'
    vibrate(10)
  }))
}

async function init(){
  initBalances()
  await fetchPrices()
  initSlider()
  initTokenPicker()
  initMinMax()
  initSwapCenter()
  initSegControl()
  initBottomSwap()
  initHistory()
  updateAmounts()
  const splash = document.getElementById('splash')
  const app = document.getElementById('app')
  setTimeout(()=>{ if(splash){ splash.style.transition='opacity 300ms'; splash.style.opacity='0'; setTimeout(()=>{splash.style.display='none'; app.style.display='block'},350)} else app.style.display='block' }, 600)
  setInterval(async ()=>{ await fetchPrices(); updateAmounts() }, 30000)
}

window.addEventListener('DOMContentLoaded', init)
