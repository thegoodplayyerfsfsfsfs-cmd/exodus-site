// UI behavior tweaks for Exodus-like swap screen

function $(s){return document.querySelector(s)}
function $all(s){return Array.from(document.querySelectorAll(s))}

function hideSplash(){const splash=$('#splash'), app=$('#app'); if(splash){splash.style.transition='opacity 300ms';splash.style.opacity='0';setTimeout(()=>{splash.style.display='none';app.style.display='block'},350)}else app.style.display='block'}

function initUI(){
  hideSplash()
  const swapCenter = $('#swap-center')
  swapCenter.addEventListener('click', ()=>{
    // simple visual swap animation
    swapCenter.animate([{transform:'rotate(0deg)'},{transform:'rotate(180deg)'}],{duration:420,fill:'forwards'})
    // swap the token icons/text
    const leftSym = $('.from-row .token-symbol').textContent
    const rightSym = $('.to-row .token-symbol').textContent
    $('.from-row .token-symbol').textContent = rightSym
    $('.to-row .token-symbol').textContent = leftSym
    // swap icons
    const leftIcon = $('.from-row .token-icon').textContent
    const rightIcon = $('.to-row .token-icon').textContent
    $('.from-row .token-icon').textContent = rightIcon
    $('.to-row .token-icon').textContent = leftIcon
  })
}

window.addEventListener('DOMContentLoaded', initUI)
