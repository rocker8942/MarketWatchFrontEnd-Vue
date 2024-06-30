<template>
  <GoogleChart />
</template>

<script lang="ts">
import GoogleChart from "../components/GoogleChart";

export default {
  name: "App",
  components: {
    GoogleChart,
  },
};

//     function getData(stockPrices) {
//         var data = new google.visualization.DataTable();
//         data.addColumn('date', 'Year');
//         data.addColumn('number', 'Price');

//         for (var i = 0; i < stockPrices.length; i++) {
//             var row = new Array();
//             var date = stockPrices[i].lastTradeDate;
//             row[0] = new Date(parseInt(date.substr(6)));
//             row[1] = stockPrices[i].adjClosePrice;
//             data.addRow(row);
//         }

//         return data;
//     }

//     var _chart = {
//         drawChart: function(element, data) {
//             var options = { title: '' };
//             var chart = new google.visualization.LineChart(document.getElementById(element));
//             chart.draw(data, options);
//         }
//     };

//     function drawChart3() {
//         var data = getData(@Html.Raw(ViewBag.StockPrices3));
//         var options = { title: '' };
//         var chart = new google.visualization.LineChart(document.getElementById('chart_div_china'));
//         chart.draw(data, options);
//     }

//     function drawChart4() {
//         var data = getData(@Html.Raw(ViewBag.StockPrices4));
//         var options = { title: '' };
//         var chart = new google.visualization.LineChart(document.getElementById('chart_div_korea'));
//         chart.draw(data, options);
//     }

//     function drawChart5() {
//         var data = getData(@Html.Raw(ViewBag.StockPrices5));
//         var options = { title: '' };
//         var chart = new google.visualization.LineChart(document.getElementById('chart_div_aus'));
//         chart.draw(data, options);
//     }

//     function drawChart6() {
//         var data = getData(@Html.Raw(ViewBag.StockPrices6));
//         var options = { title: '' };
//         var chart = new google.visualization.LineChart(document.getElementById('chart_div_dollar'));
//         chart.draw(data, options);
//     }

//     function drawChart7() {
//         var data = getData(@Html.Raw(ViewBag.StockPrices7));
//         var options = { title: '' };
//         var chart = new google.visualization.LineChart(document.getElementById('chart_div_gold'));
//         chart.draw(data, options);
//     }

//     function drawChart8() {
//         var data = getData(@Html.Raw(ViewBag.StockPrices8));
//         var options = { title: '' };
//         var chart = new google.visualization.LineChart(document.getElementById('chart_div_tbond'));
//         chart.draw(data, options);
//     }

//     google.load("visualization", "1", { packages: ["corechart"] });
//     google.setOnLoadCallback(function() {
//         _chart.drawChart('chart_div_snp500', getData(@Html.Raw(ViewBag.StockPrices1)));
//     });
//     google.setOnLoadCallback(function() {
//         _chart.drawChart('chart_div_ftse100', getData(@Html.Raw(ViewBag.StockPrices2)));
//     });
//     google.setOnLoadCallback(function() {
//         _chart.drawChart('chart_div_china', getData(@Html.Raw(ViewBag.StockPrices3)));
//     });
//     google.setOnLoadCallback(drawChart4);
//     google.setOnLoadCallback(drawChart5);
//     google.setOnLoadCallback(drawChart6);
//     google.setOnLoadCallback(drawChart7);
//     google.setOnLoadCallback(drawChart8);
//
</script>
