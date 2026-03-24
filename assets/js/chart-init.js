(function(){
  window.MPCharts = window.MPCharts || {};
  window.MPCharts.destroyAll = function(){
    try{ window.sensorWeightsChart?.destroy?.(); }catch{}
    try{ window.driftChart?.destroy?.(); }catch{}
    try{ window.cueBiasChart?.destroy?.(); }catch{}
    try{ window.emotionalBaselineChart?.destroy?.(); }catch{}
  };
})();

