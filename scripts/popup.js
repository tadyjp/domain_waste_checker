// var settings = new Store("settings", {
//     "sample_setting": "This is how you use Store.js to remember values"
// });

var DWC = chrome.extension.getBackgroundPage().DWC;

var PopupView = {

  // Entry point.
  init: function(){
    console.log("PopupView.init")
    $(function () {
      this.i18n();
      this.configHighcharts();
    }.bind(this));
    DWC.Watch.getByToday(function(_data){
      DWC.Tools.log(_data);

      this.drawGraph(_data);
    }.bind(this));
  },

  //=== 国際化対応
  // "i18n"クラスを対応する文字に変換
  i18n: function(){
    $(".i18n").each(function(){
      var $this = $(this);
      $this.text(chrome.i18n.getMessage("i18n_" + $this.attr("id")));
    });
  },

  //=== Highcharts初期化
  configHighcharts: function(){
    // Radialize the colors
    Highcharts.getOptions().colors = Highcharts.map(Highcharts.getOptions().colors, function(color) {
      return {
        radialGradient: { cx: 0.5, cy: 0.3, r: 0.7 },
        stops: [
          [0, color],
          [1, Highcharts.Color(color).brighten(-0.3).get('rgb')] // darken
        ]
      };
    });
  },

  //=== Highcharts描画
  drawGraph: function(_data){
    $('#container').highcharts({
      chart: {
        plotBackgroundColor: null,
        plotBorderWidth: null,
        plotShadow: false
      },
      title: {
        text: null
      },
      tooltip: {
        pointFormat: '{series.name}: <b>{point.percentage}%</b>',
        percentageDecimals: 1
      },
      plotOptions: {
        pie: {
          allowPointSelect: true,
          cursor: 'pointer',
          dataLabels: {
            enabled: true,
            color: '#000000',
            connectorColor: '#000000',
            formatter: function() {
              DWC.Tools.log(this);
              return '<b>'+ this.point.name +'</b>:<br> '+ this.percentage.toFixed(2) +' % (' + (this.y / 60).toFixed(0) + ' min.)';
            }
          }
        }
      },
      series: [{
        type: 'pie',
        name: 'Browser share',
        data: _data
      }]
    });
  }
};

PopupView.init();



