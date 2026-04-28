/* =====================================================
   NUCLEAR CONSOLE LOCK
   Loaded as the very first script in every page.
   Object.defineProperty + Object.freeze means no
   injected script can ever restore console methods.
===================================================== */
(function(){
  var noop = function(){};
  var methods = [
    'log','error','warn','info','debug','dir','dirxml','table',
    'trace','group','groupCollapsed','groupEnd','time','timeEnd',
    'timeLog','timeStamp','profile','profileEnd','count','countReset',
    'assert','clear'
  ];
  methods.forEach(function(m){
    try {
      Object.defineProperty(console, m, {
        get: function(){ return noop; },
        set: function(){},
        configurable: false,
        enumerable: false
      });
    } catch(e){}
  });
  try { Object.freeze(console); } catch(e){}
})();