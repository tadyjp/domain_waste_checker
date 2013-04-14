
var MIN_SESSION_SECOND = 30; // TODO: remove hard coding

var last_action_time = 0;
var onUserActionOnPage = function(_e){
  var now_time = new Date().getTime() / 1000;

  // もし、最後のアクションから時間がたっていたら
  if(last_action_time + MIN_SESSION_SECOND < now_time){
    last_action_time = now_time;

    chrome.runtime.sendMessage({type: "onUserActionOnPage"}, function(response) {
      console.log(response);
    });
  }
};

window.addEventListener("click", onUserActionOnPage);
window.addEventListener("mousemove", onUserActionOnPage);
