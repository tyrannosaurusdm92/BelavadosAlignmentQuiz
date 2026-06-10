
window.addEventListener('DOMContentLoaded',()=>{
  const result=document.getElementById('result');
  if(result && (!window.DICE || !window.THREE || !window.CANNON || !window.$t)){
    result.textContent='Dice roller libraries did not initialize inside the all-in-one file.';
  }
});
