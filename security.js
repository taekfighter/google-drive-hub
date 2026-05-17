/* =====================================================
   NUCLEAR CONSOLE LOCK
   Loaded as the very first script in every page.
   Object.defineProperty means no injected script can
   restore the locked console methods.

   NOTE: console.error and console.warn are intentionally
   NOT locked. Firebase SDK uses them internally to report
   connection errors. Locking them causes silent failures
   that are impossible to diagnose. All user-visible
   methods (log, info, debug, dir, table, etc.) are
   still fully blocked to prevent casual snooping.
===================================================== */
(function(){
  var noop = function(){};
  var methods = [
    'log','info','debug','dir','dirxml','table',
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
  /* Do NOT call Object.freeze(console) — that also locks error/warn
     and silences Firebase's own internal connection error reporting. */
})();