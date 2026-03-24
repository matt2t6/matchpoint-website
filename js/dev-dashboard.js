(function(){
  window.addEventListener('mp:scan-complete', (e)=>{
    const {pass, failures=[]} = e.detail || {};
    const md = [
      '# MP Bug Scan Report',
      '',
      `- Result: ${pass ? 'PASS' : 'FAIL'}`,
      failures.length ? `- Issues:\n  - ${failures.join('\n  - ')}` : '- Issues: none'
    ].join('\n');
    console.log(md);
  });
})();

