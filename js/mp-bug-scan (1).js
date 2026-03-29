(function(){
  window.MP_BugScan = {
    run()
    {
      const failures = [];
      const mustHave = ['hub-status-dot','error-banner','walkthrough-overlay','walkthrough-text'];
      mustHave.forEach(id => { if (!document.getElementById(id)) failures.push(`missing #${id}`); });
      const resEntries = (performance.getEntriesByType && performance.getEntriesByType('resource')) || [];
      const zero404 = resEntries.filter(e => e.decodedBodySize === 0 && /\.(png|jpg|mp3|mp4|css|js)$/i.test(e.name));
      if (zero404.length) failures.push(`zero-size resources: ${zero404.length}`);
      const pass = failures.length === 0;
      const report = { pass, failures };
      window.dispatchEvent(new CustomEvent('mp:scan-complete',{ detail: report }));
      return report;
    }
  };
})();

