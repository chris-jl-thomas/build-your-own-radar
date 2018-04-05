const d3 = require('d3');
const d3tip = require('d3-tip');
const Chance = require('chance');
const _ = require('lodash/core');

const RingCalculator = require('../util/ringCalculator');

const MIN_BLIP_WIDTH = 12;

const Radar = function (size, radar) {
  var svg, radarElement;

  var tip = d3tip().attr('class', 'd3-tip').html(function (text) {
    return text;
  });

  tip.direction(function () {
    if (d3.select('.quadrant-table.selected').node()) {
      var selectedQuadrant = d3.select('.quadrant-table.selected');
      if (selectedQuadrant.classed('first') || selectedQuadrant.classed('fourth'))
        return 'ne';
      else
        return 'nw';
    }
    return 'n';
  });

  var ringCalculator = new RingCalculator(radar.rings().length, center());

  var self = {};

  function center() {
    return Math.round(size / 2);
  }

  function toRadian(angleInDegrees) {
    return Math.PI * angleInDegrees / 180;
  }

  function plotLines(quadrantGroup, quadrant) {
    var startX = size * (1 - (-Math.sin(toRadian(quadrant.startAngle)) + 1) / 2);
    var endX = size * (1 - (-Math.sin(toRadian(quadrant.startAngle - 90)) + 1) / 2);

    var startY = size * (1 - (Math.cos(toRadian(quadrant.startAngle)) + 1) / 2);
    var endY = size * (1 - (Math.cos(toRadian(quadrant.startAngle - 90)) + 1) / 2);

    if (startY > endY) {
      var aux = endY;
      endY = startY;
      startY = aux;
    }

    quadrantGroup.append('line')
      .attr('x1', center()).attr('x2', center())
      .attr('y1', startY - 2).attr('y2', endY + 2)
      .attr('stroke-width', 10);

    quadrantGroup.append('line')
      .attr('x1', endX).attr('y1', center())
      .attr('x2', startX).attr('y2', center())
      .attr('stroke-width', 10);
  }

  function plotQuadrant(rings, quadrant) {
    var quadrantGroup = svg.append('g')
      .attr('class', 'quadrant-group quadrant-group-' + quadrant.order)
      .on('mouseover', mouseoverQuadrant.bind({}, quadrant.order))
      .on('mouseout', mouseoutQuadrant.bind({}, quadrant.order))
      .on('click', selectQuadrant.bind({}, quadrant.order, quadrant.startAngle));

    rings.forEach(function (ring, i) {
      var arc = d3.arc()
        .innerRadius(ringCalculator.getRadius(i))
        .outerRadius(ringCalculator.getRadius(i + 1))
        .startAngle(toRadian(quadrant.startAngle))
        .endAngle(toRadian(quadrant.startAngle - 90));

      quadrantGroup.append('path')
        .attr('d', arc)
        .attr('class', 'ring-arc-' + ring.order())
        .attr('transform', 'translate(' + center() + ', ' + center() + ')');
    });

    return quadrantGroup;
  }

  function plotTexts(quadrantGroup, rings, quadrant) {
    rings.forEach(function (ring, i) {
      if (quadrant.order === 'first' || quadrant.order === 'fourth') {
        quadrantGroup.append('text')
          .attr('class', 'line-text')
          .attr('y', center() + 4)
          .attr('x', center() + (ringCalculator.getRadius(i) + ringCalculator.getRadius(i + 1)) / 2)
          .attr('text-anchor', 'middle')
          .text(ring.name());
      } else {
        quadrantGroup.append('text')
          .attr('class', 'line-text')
          .attr('y', center() + 4)
          .attr('x', center() - (ringCalculator.getRadius(i) + ringCalculator.getRadius(i + 1)) / 2)
          .attr('text-anchor', 'middle')
          .text(ring.name());
      }
    });
  }

  function triangle(blip, x, y, order, group) {
    return group.append('path').attr('d', "M412.201,311.406c0.021,0,0.042,0,0.063,0c0.067,0,0.135,0,0.201,0c4.052,0,6.106-0.051,8.168-0.102c2.053-0.051,4.115-0.102,8.176-0.102h0.103c6.976-0.183,10.227-5.306,6.306-11.53c-3.988-6.121-4.97-5.407-8.598-11.224c-1.631-3.008-3.872-4.577-6.179-4.577c-2.276,0-4.613,1.528-6.48,4.699c-3.578,6.077-3.26,6.014-7.306,11.723C402.598,306.067,405.426,311.406,412.201,311.406")
      .attr('transform', 'scale(' + (blip.width / 34) + ') translate(' + (-404 + x * (34 / blip.width) - 17) + ', ' + (-282 + y * (34 / blip.width) - 17) + ')')
      .attr('class', order);
  }

  function movingOutArrow(blip, x, y, order, group) {

    var svg = ""

    switch (order) {
      case "first":
        svg = "M0.000 200.000 L 0.000 400.000 199.600 400.000 L 399.200 400.000 399.200 200.000 L 399.200 0.000 199.600 0.000 L 0.000 0.000 0.000 200.000 M187.200 103.400 C 188.850 103.474,195.690 103.642,202.400 103.772 C 221.731 104.147,232.861 104.401,240.400 104.637 C 244.250 104.758,254.060 105.003,262.200 105.182 C 276.639 105.499,277.078 105.533,280.200 106.553 C 292.434 110.552,295.729 120.314,293.852 147.000 C 293.282 155.105,292.968 162.314,292.186 185.200 C 292.077 188.390,291.817 193.250,291.609 196.000 C 291.400 198.750,291.134 203.430,291.016 206.400 C 289.803 237.086,289.587 239.207,287.182 244.016 C 280.534 257.309,263.121 257.032,256.804 243.533 C 254.520 238.652,254.484 233.581,256.480 197.400 C 257.015 187.711,257.464 171.680,257.262 169.539 C 256.967 166.423,258.328 165.119,176.431 246.981 C 103.259 320.122,95.219 327.994,93.037 328.630 C 92.577 328.764,91.390 329.261,90.400 329.735 C 79.166 335.108,65.004 320.698,70.564 309.553 C 70.914 308.851,71.200 308.071,71.200 307.818 C 71.200 305.679,76.722 300.003,154.863 221.827 C 199.048 177.622,235.200 141.313,235.200 141.141 C 235.200 139.653,231.503 139.381,204.200 138.857 C 158.686 137.983,150.611 137.519,146.658 135.546 C 130.772 127.618,133.280 107.135,150.600 103.346 C 152.811 102.862,176.077 102.897,187.200 103.400 "
        break;
      case "second":
        svg = "M0.000 200.000 L 0.000 400.000 200.000 400.000 L 400.000 400.000 400.000 200.000 L 400.000 0.000 200.000 0.000 L 0.000 0.000 0.000 200.000 M151.000 105.192 C 156.280 105.419,164.470 105.785,169.200 106.006 C 173.930 106.226,184.190 106.676,192.000 107.006 C 199.810 107.336,209.350 107.795,213.200 108.027 C 217.050 108.258,223.710 108.612,228.000 108.812 C 245.162 109.613,252.600 114.811,252.600 126.000 C 252.600 138.076,243.377 143.690,225.600 142.435 C 199.146 140.567,167.275 139.708,166.573 140.843 C 166.060 141.674,171.428 147.144,245.425 221.200 C 288.400 264.210,324.193 300.233,324.963 301.252 C 337.761 318.177,320.208 335.953,303.403 323.086 C 302.234 322.191,224.622 244.968,182.856 203.142 C 182.055 202.341,172.678 192.936,162.018 182.242 C 151.357 171.549,142.552 162.800,142.449 162.800 C 142.347 162.800,141.979 162.550,141.631 162.244 C 141.209 161.873,140.712 161.798,140.132 162.020 C 138.915 162.484,138.855 163.348,138.396 187.200 C 138.177 198.530,137.903 209.240,137.787 211.000 C 137.670 212.760,137.403 220.959,137.192 229.219 C 136.765 245.965,136.396 248.586,133.893 252.719 C 125.683 266.268,107.664 262.630,103.887 246.659 C 103.226 243.863,103.677 210.942,104.620 193.200 C 104.720 191.330,104.993 178.730,105.227 165.200 C 105.982 121.539,106.100 119.880,108.806 114.906 C 113.118 106.979,121.423 103.992,137.400 104.621 C 139.600 104.708,145.720 104.964,151.000 105.192"
        break;
      case "third":
        svg = "M0.000 200.600 L 0.000 400.000 200.000 400.000 L 400.000 400.000 400.000 200.600 L 400.000 1.200 200.000 1.200 L 0.000 1.200 0.000 200.600 M319.745 73.543 C 328.205 77.708,330.441 86.902,325.303 96.400 C 324.045 98.726,255.632 167.846,198.800 224.212 C 183.209 239.674,163.551 259.487,162.958 260.337 C 161.363 262.619,164.189 263.076,180.400 263.159 C 185.130 263.183,196.830 263.463,206.400 263.781 C 215.970 264.099,227.670 264.469,232.400 264.603 C 247.235 265.023,250.624 265.736,255.332 269.432 C 266.431 278.143,261.944 295.162,247.686 298.436 C 244.990 299.055,212.844 298.730,185.600 297.808 C 178.707 297.575,150.136 296.909,133.735 296.599 C 118.256 296.307,114.570 295.259,109.636 289.746 C 104.825 284.370,103.049 273.152,104.563 257.694 C 104.913 254.116,105.200 248.716,105.201 245.694 C 105.201 240.523,105.477 233.722,106.412 215.800 C 106.630 211.620,106.988 203.790,107.208 198.400 C 107.428 193.010,107.686 187.430,107.781 186.000 C 107.877 184.570,108.060 180.790,108.189 177.600 C 109.027 156.836,113.913 149.000,126.021 149.000 C 138.227 149.000,144.025 158.146,142.841 175.534 C 142.041 187.274,140.806 216.626,140.689 226.663 C 140.592 235.028,140.589 235.013,142.198 234.401 C 142.808 234.169,178.338 198.950,221.154 156.137 C 263.969 113.324,299.888 77.586,300.972 76.719 C 306.988 71.910,314.014 70.722,319.745 73.543 "
        break;
      case "fourth":
        svg = "M0.000 200.000 L 0.000 400.000 200.000 400.000 L 400.000 400.000 400.000 200.000 L 400.000 0.000 200.000 0.000 L 0.000 0.000 0.000 200.000 M88.798 72.834 C 91.130 73.371,94.927 75.304,97.200 77.111 C 98.190 77.898,134.767 114.283,178.482 157.967 C 222.197 201.651,258.341 237.560,258.801 237.766 C 261.084 238.784,261.085 238.770,261.585 214.000 C 261.835 201.570,262.110 190.140,262.196 188.600 C 262.281 187.060,262.549 179.230,262.791 171.200 C 263.260 155.610,263.568 152.680,265.100 149.208 C 272.119 133.299,293.414 136.513,296.455 153.940 C 296.881 156.383,296.727 179.233,296.195 192.459 C 295.973 197.981,295.273 225.881,294.988 240.600 C 294.242 279.049,294.142 280.341,291.535 285.252 C 286.787 294.196,276.608 296.896,254.000 295.211 C 251.030 294.989,243.020 294.630,236.200 294.413 C 229.380 294.196,218.670 293.755,212.400 293.434 C 206.130 293.112,194.430 292.551,186.400 292.186 C 162.285 291.092,159.145 290.602,154.145 287.162 C 144.748 280.697,144.944 266.943,154.520 260.753 C 159.699 257.406,164.061 256.847,177.800 257.766 C 192.389 258.743,229.945 260.119,231.651 259.740 C 233.673 259.290,233.670 259.295,233.024 258.047 C 232.692 257.404,197.540 221.986,154.908 179.339 C 75.129 99.532,74.434 98.823,72.618 95.322 C 66.110 82.783,75.477 69.765,88.798 72.834 "
        break;
    }

    return group.append('path').attr('d', svg)
      .attr('transform', 'scale(' + (blip.width / 400) + ') translate(' + (-404 + x * (400 / blip.width) - 17) + ', ' + (-282 + y * (400 / blip.width) - 17) + ')')
      .attr('class', order);
  }

  function movingInArrow(blip, x, y, order, group) {

    var svg = ""

    console.log(order)

    switch (order) {
      case "first":
        svg = "M0.000 200.600 L 0.000 400.000 200.000 400.000 L 400.000 400.000 400.000 200.600 L 400.000 1.200 200.000 1.200 L 0.000 1.200 0.000 200.600 M319.745 73.543 C 328.205 77.708,330.441 86.902,325.303 96.400 C 324.045 98.726,255.632 167.846,198.800 224.212 C 183.209 239.674,163.551 259.487,162.958 260.337 C 161.363 262.619,164.189 263.076,180.400 263.159 C 185.130 263.183,196.830 263.463,206.400 263.781 C 215.970 264.099,227.670 264.469,232.400 264.603 C 247.235 265.023,250.624 265.736,255.332 269.432 C 266.431 278.143,261.944 295.162,247.686 298.436 C 244.990 299.055,212.844 298.730,185.600 297.808 C 178.707 297.575,150.136 296.909,133.735 296.599 C 118.256 296.307,114.570 295.259,109.636 289.746 C 104.825 284.370,103.049 273.152,104.563 257.694 C 104.913 254.116,105.200 248.716,105.201 245.694 C 105.201 240.523,105.477 233.722,106.412 215.800 C 106.630 211.620,106.988 203.790,107.208 198.400 C 107.428 193.010,107.686 187.430,107.781 186.000 C 107.877 184.570,108.060 180.790,108.189 177.600 C 109.027 156.836,113.913 149.000,126.021 149.000 C 138.227 149.000,144.025 158.146,142.841 175.534 C 142.041 187.274,140.806 216.626,140.689 226.663 C 140.592 235.028,140.589 235.013,142.198 234.401 C 142.808 234.169,178.338 198.950,221.154 156.137 C 263.969 113.324,299.888 77.586,300.972 76.719 C 306.988 71.910,314.014 70.722,319.745 73.543 "
        break;
      case "second":
        svg = "M0.000 200.000 L 0.000 400.000 200.000 400.000 L 400.000 400.000 400.000 200.000 L 400.000 0.000 200.000 0.000 L 0.000 0.000 0.000 200.000 M88.798 72.834 C 91.130 73.371,94.927 75.304,97.200 77.111 C 98.190 77.898,134.767 114.283,178.482 157.967 C 222.197 201.651,258.341 237.560,258.801 237.766 C 261.084 238.784,261.085 238.770,261.585 214.000 C 261.835 201.570,262.110 190.140,262.196 188.600 C 262.281 187.060,262.549 179.230,262.791 171.200 C 263.260 155.610,263.568 152.680,265.100 149.208 C 272.119 133.299,293.414 136.513,296.455 153.940 C 296.881 156.383,296.727 179.233,296.195 192.459 C 295.973 197.981,295.273 225.881,294.988 240.600 C 294.242 279.049,294.142 280.341,291.535 285.252 C 286.787 294.196,276.608 296.896,254.000 295.211 C 251.030 294.989,243.020 294.630,236.200 294.413 C 229.380 294.196,218.670 293.755,212.400 293.434 C 206.130 293.112,194.430 292.551,186.400 292.186 C 162.285 291.092,159.145 290.602,154.145 287.162 C 144.748 280.697,144.944 266.943,154.520 260.753 C 159.699 257.406,164.061 256.847,177.800 257.766 C 192.389 258.743,229.945 260.119,231.651 259.740 C 233.673 259.290,233.670 259.295,233.024 258.047 C 232.692 257.404,197.540 221.986,154.908 179.339 C 75.129 99.532,74.434 98.823,72.618 95.322 C 66.110 82.783,75.477 69.765,88.798 72.834 "
        break;
      case "third":
        svg = "M0.000 200.000 L 0.000 400.000 199.600 400.000 L 399.200 400.000 399.200 200.000 L 399.200 0.000 199.600 0.000 L 0.000 0.000 0.000 200.000 M187.200 103.400 C 188.850 103.474,195.690 103.642,202.400 103.772 C 221.731 104.147,232.861 104.401,240.400 104.637 C 244.250 104.758,254.060 105.003,262.200 105.182 C 276.639 105.499,277.078 105.533,280.200 106.553 C 292.434 110.552,295.729 120.314,293.852 147.000 C 293.282 155.105,292.968 162.314,292.186 185.200 C 292.077 188.390,291.817 193.250,291.609 196.000 C 291.400 198.750,291.134 203.430,291.016 206.400 C 289.803 237.086,289.587 239.207,287.182 244.016 C 280.534 257.309,263.121 257.032,256.804 243.533 C 254.520 238.652,254.484 233.581,256.480 197.400 C 257.015 187.711,257.464 171.680,257.262 169.539 C 256.967 166.423,258.328 165.119,176.431 246.981 C 103.259 320.122,95.219 327.994,93.037 328.630 C 92.577 328.764,91.390 329.261,90.400 329.735 C 79.166 335.108,65.004 320.698,70.564 309.553 C 70.914 308.851,71.200 308.071,71.200 307.818 C 71.200 305.679,76.722 300.003,154.863 221.827 C 199.048 177.622,235.200 141.313,235.200 141.141 C 235.200 139.653,231.503 139.381,204.200 138.857 C 158.686 137.983,150.611 137.519,146.658 135.546 C 130.772 127.618,133.280 107.135,150.600 103.346 C 152.811 102.862,176.077 102.897,187.200 103.400 "
        break;
      case "fourth":
        svg = "M0.000 200.000 L 0.000 400.000 200.000 400.000 L 400.000 400.000 400.000 200.000 L 400.000 0.000 200.000 0.000 L 0.000 0.000 0.000 200.000 M151.000 105.192 C 156.280 105.419,164.470 105.785,169.200 106.006 C 173.930 106.226,184.190 106.676,192.000 107.006 C 199.810 107.336,209.350 107.795,213.200 108.027 C 217.050 108.258,223.710 108.612,228.000 108.812 C 245.162 109.613,252.600 114.811,252.600 126.000 C 252.600 138.076,243.377 143.690,225.600 142.435 C 199.146 140.567,167.275 139.708,166.573 140.843 C 166.060 141.674,171.428 147.144,245.425 221.200 C 288.400 264.210,324.193 300.233,324.963 301.252 C 337.761 318.177,320.208 335.953,303.403 323.086 C 302.234 322.191,224.622 244.968,182.856 203.142 C 182.055 202.341,172.678 192.936,162.018 182.242 C 151.357 171.549,142.552 162.800,142.449 162.800 C 142.347 162.800,141.979 162.550,141.631 162.244 C 141.209 161.873,140.712 161.798,140.132 162.020 C 138.915 162.484,138.855 163.348,138.396 187.200 C 138.177 198.530,137.903 209.240,137.787 211.000 C 137.670 212.760,137.403 220.959,137.192 229.219 C 136.765 245.965,136.396 248.586,133.893 252.719 C 125.683 266.268,107.664 262.630,103.887 246.659 C 103.226 243.863,103.677 210.942,104.620 193.200 C 104.720 191.330,104.993 178.730,105.227 165.200 C 105.982 121.539,106.100 119.880,108.806 114.906 C 113.118 106.979,121.423 103.992,137.400 104.621 C 139.600 104.708,145.720 104.964,151.000 105.192"
        break;
    }

    return group.append('path').attr('d', svg)
      .attr('transform', 'scale(' + (blip.width / 400) + ') translate(' + (-404 + x * (400 / blip.width) - 17) + ', ' + (-282 + y * (400 / blip.width) - 17) + ')')
      .attr('class', order);
  }

  function triangleLegend(x, y, group) {
    return group.append('path').attr('d', "M412.201,311.406c0.021,0,0.042,0,0.063,0c0.067,0,0.135,0,0.201,0c4.052,0,6.106-0.051,8.168-0.102c2.053-0.051,4.115-0.102,8.176-0.102h0.103c6.976-0.183,10.227-5.306,6.306-11.53c-3.988-6.121-4.97-5.407-8.598-11.224c-1.631-3.008-3.872-4.577-6.179-4.577c-2.276,0-4.613,1.528-6.48,4.699c-3.578,6.077-3.26,6.014-7.306,11.723C402.598,306.067,405.426,311.406,412.201,311.406")
      .attr('transform', 'scale(' + (22 / 64) + ') translate(' + (-404 + x * (64 / 22) - 17) + ', ' + (-282 + y * (64 / 22) - 17) + ')');
  }

  function circle(blip, x, y, order, group) {
    return (group || svg).append('path')
      .attr('d', "M420.084,282.092c-1.073,0-2.16,0.103-3.243,0.313c-6.912,1.345-13.188,8.587-11.423,16.874c1.732,8.141,8.632,13.711,17.806,13.711c0.025,0,0.052,0,0.074-0.003c0.551-0.025,1.395-0.011,2.225-0.109c4.404-0.534,8.148-2.218,10.069-6.487c1.747-3.886,2.114-7.993,0.913-12.118C434.379,286.944,427.494,282.092,420.084,282.092")
      .attr('transform', 'scale(' + (blip.width / 34) + ') translate(' + (-404 + x * (34 / blip.width) - 17) + ', ' + (-282 + y * (34 / blip.width) - 17) + ')')
      .attr('class', order);
  }

  function circleLegend(x, y, group) {
    return (group || svg).append('path')
      .attr('d', "M420.084,282.092c-1.073,0-2.16,0.103-3.243,0.313c-6.912,1.345-13.188,8.587-11.423,16.874c1.732,8.141,8.632,13.711,17.806,13.711c0.025,0,0.052,0,0.074-0.003c0.551-0.025,1.395-0.011,2.225-0.109c4.404-0.534,8.148-2.218,10.069-6.487c1.747-3.886,2.114-7.993,0.913-12.118C434.379,286.944,427.494,282.092,420.084,282.092")
      .attr('transform', 'scale(' + (22 / 64) + ') translate(' + (-404 + x * (64 / 22) - 17) + ', ' + (-282 + y * (64 / 22) - 17) + ')');
  }

  function addRing(ring, order) {
    var table = d3.select('.quadrant-table.' + order);
    table.append('h3').text(ring);
    return table.append('ul');
  }

  function calculateBlipCoordinates(blip, chance, minRadius, maxRadius, startAngle) {
    var adjustX = Math.sin(toRadian(startAngle)) - Math.cos(toRadian(startAngle));
    var adjustY = -Math.cos(toRadian(startAngle)) - Math.sin(toRadian(startAngle));

    var radius = chance.floating({min: minRadius + blip.width / 2, max: maxRadius - blip.width / 2});
    var angleDelta = Math.asin(blip.width / 2 / radius) * 180 / Math.PI;
    angleDelta = angleDelta > 45 ? 45 : angleDelta;
    var angle = toRadian(chance.integer({min: angleDelta, max: 90 - angleDelta}));

    var x = center() + radius * Math.cos(angle) * adjustX;
    var y = center() + radius * Math.sin(angle) * adjustY;

    return [x, y];
  }

  function thereIsCollision(blip, coordinates, allCoordinates) {
    return allCoordinates.some(function (currentCoordinates) {
      return (Math.abs(currentCoordinates[0] - coordinates[0]) < blip.width) && (Math.abs(currentCoordinates[1] - coordinates[1]) < blip.width)
    });
  }

  function plotBlips(quadrantGroup, rings, quadrantWrapper) {
    var blips, quadrant, startAngle, order;

    quadrant = quadrantWrapper.quadrant;
    startAngle = quadrantWrapper.startAngle;
    order = quadrantWrapper.order;

    d3.select('.quadrant-table.' + order)
      .append('h2')
      .attr('class', 'quadrant-table__name')
      .text(quadrant.name());

    blips = quadrant.blips();
    rings.forEach(function (ring, i) {
      var ringBlips = blips.filter(function (blip) {
        return blip.ring() == ring;
      });

      if (ringBlips.length == 0) {
        return;
      }

      var maxRadius, minRadius;

      minRadius = ringCalculator.getRadius(i);
      maxRadius = ringCalculator.getRadius(i + 1);

      var sumRing = ring.name().split('').reduce(function (p, c) {
        return p + c.charCodeAt(0);
      }, 0);
      var sumQuadrant = quadrant.name().split('').reduce(function (p, c) {
        return p + c.charCodeAt(0);
      }, 0);
      var chance = new Chance(Math.PI * sumRing * ring.name().length * sumQuadrant * quadrant.name().length);

      var ringList = addRing(ring.name(), order);
      var allBlipCoordinatesInRing = [];

      ringBlips.forEach(function (blip) {
        const coordinates = findBlipCoordinates(blip,
          minRadius,
          maxRadius,
          startAngle,
          allBlipCoordinatesInRing);

        allBlipCoordinatesInRing.push(coordinates);
        drawBlipInCoordinates(blip, coordinates, order, quadrantGroup, ringList);
      });
    });
  }

  function findBlipCoordinates(blip, minRadius, maxRadius, startAngle, allBlipCoordinatesInRing) {
    const maxIterations = 200;
    var coordinates = calculateBlipCoordinates(blip, chance, minRadius, maxRadius, startAngle);
    var iterationCounter = 0;
    var foundAPlace = false;

    while (iterationCounter < maxIterations) {
      if (thereIsCollision(blip, coordinates, allBlipCoordinatesInRing)) {
        coordinates = calculateBlipCoordinates(blip, chance, minRadius, maxRadius, startAngle);
      } else {
        foundAPlace = true;
        break;
      }
      iterationCounter++;
    }

    if (!foundAPlace && blip.width > MIN_BLIP_WIDTH) {
      blip.width = blip.width - 1;
      return findBlipCoordinates(blip, minRadius, maxRadius, startAngle, allBlipCoordinatesInRing);
    } else {
      return coordinates;
    }
  }

  function drawBlipInCoordinates(blip, coordinates, order, quadrantGroup, ringList) {
    var x = coordinates[0];
    var y = coordinates[1];

    var group = quadrantGroup.append('g').attr('class', 'blip-link');

    if (blip.isNew()) {
      movingInArrow(blip, x, y, order, group, order);
    } else {
      movingOutArrow(blip, x, y, order, group, order);
    }

    group.append('text')
      .attr('x', x)
      .attr('y', y + 4)
      .attr('class', 'blip-text')
      // derive font-size from current blip width
      .style('font-size', ((blip.width * 10) / 22) + 'px')
      .attr('text-anchor', 'middle')
      .text(blip.number());

    var blipListItem = ringList.append('li');
    var blipText = blip.number() + '. ' + blip.name() + (blip.topic() ? ('. - ' + blip.topic()) : '');
    blipListItem.append('div')
      .attr('class', 'blip-list-item')
      .text(blipText);

    var blipItemDescription = blipListItem.append('div')
      .attr('class', 'blip-item-description');
    if (blip.description()) {
      blipItemDescription.append('p').html(blip.description());
    }

    var mouseOver = function () {
      d3.selectAll('g.blip-link').attr('opacity', 0.3);
      group.attr('opacity', 1.0);
      blipListItem.selectAll('.blip-list-item').classed('highlight', true);
      tip.show(blip.name(), group.node());
    };

    var mouseOut = function () {
      d3.selectAll('g.blip-link').attr('opacity', 1.0);
      blipListItem.selectAll('.blip-list-item').classed('highlight', false);
      tip.hide().style('left', 0).style('top', 0);
    };

    blipListItem.on('mouseover', mouseOver).on('mouseout', mouseOut);
    group.on('mouseover', mouseOver).on('mouseout', mouseOut);

    var clickBlip = function () {
      d3.select('.blip-item-description.expanded').node() !== blipItemDescription.node() &&
      d3.select('.blip-item-description.expanded').classed("expanded", false);
      blipItemDescription.classed("expanded", !blipItemDescription.classed("expanded"));

      blipItemDescription.on('click', function () {
        d3.event.stopPropagation();
      });
    };

    blipListItem.on('click', clickBlip);
  }

  function removeHomeLink(){
    d3.select('.home-link').remove();
  }

  function createHomeLink(pageElement) {
    if (pageElement.select('.home-link').empty()) {
      pageElement.append('div')
        .html('&#171; Back to Radar home')
        .classed('home-link', true)
        .classed('selected', true)
        .on('click', redrawFullRadar)
        .append('g')
        .attr('fill', '#626F87')
        .append('path')
        .attr('d', 'M27.6904224,13.939279 C27.6904224,13.7179572 27.6039633,13.5456925 27.4314224,13.4230122 L18.9285959,6.85547454 C18.6819796,6.65886965 18.410898,6.65886965 18.115049,6.85547454 L9.90776939,13.4230122 C9.75999592,13.5456925 9.68592041,13.7179572 9.68592041,13.939279 L9.68592041,25.7825947 C9.68592041,25.979501 9.74761224,26.1391059 9.87092041,26.2620876 C9.99415306,26.3851446 10.1419265,26.4467108 10.3145429,26.4467108 L15.1946918,26.4467108 C15.391698,26.4467108 15.5518551,26.3851446 15.6751633,26.2620876 C15.7984714,26.1391059 15.8600878,25.979501 15.8600878,25.7825947 L15.8600878,18.5142424 L21.4794061,18.5142424 L21.4794061,25.7822933 C21.4794061,25.9792749 21.5410224,26.1391059 21.6643306,26.2620876 C21.7876388,26.3851446 21.9477959,26.4467108 22.1448776,26.4467108 L27.024951,26.4467108 C27.2220327,26.4467108 27.3821898,26.3851446 27.505498,26.2620876 C27.6288061,26.1391059 27.6904224,25.9792749 27.6904224,25.7822933 L27.6904224,13.939279 Z M18.4849735,0.0301425662 C21.0234,0.0301425662 23.4202449,0.515814664 25.6755082,1.48753564 C27.9308469,2.45887984 29.8899592,3.77497963 31.5538265,5.43523218 C33.2173918,7.09540937 34.5358755,9.05083299 35.5095796,11.3015031 C36.4829061,13.5518717 36.9699469,15.9439104 36.9699469,18.4774684 C36.9699469,20.1744196 36.748098,21.8101813 36.3044755,23.3844521 C35.860551,24.9584216 35.238498,26.4281731 34.4373347,27.7934053 C33.6362469,29.158336 32.6753041,30.4005112 31.5538265,31.5197047 C30.432349,32.6388982 29.1876388,33.5981853 27.8199224,34.3973401 C26.4519041,35.1968717 24.9791531,35.8176578 23.4016694,36.2606782 C21.8244878,36.7033971 20.1853878,36.9247943 18.4849735,36.9247943 C16.7841816,36.9247943 15.1453837,36.7033971 13.5679755,36.2606782 C11.9904918,35.8176578 10.5180429,35.1968717 9.15002449,34.3973401 C7.78223265,33.5978839 6.53752245,32.6388982 5.41612041,31.5197047 C4.29464286,30.4005112 3.33339796,29.158336 2.53253673,27.7934053 C1.73144898,26.4281731 1.10909388,24.9584216 0.665395918,23.3844521 C0.22184898,21.8101813 0,20.1744196 0,18.4774684 C0,16.7801405 0.22184898,15.1446802 0.665395918,13.5704847 C1.10909388,11.9962138 1.73144898,10.5267637 2.53253673,9.16153157 C3.33339796,7.79652546 4.29464286,6.55435031 5.41612041,5.43523218 C6.53752245,4.3160387 7.78223265,3.35675153 9.15002449,2.55752138 C10.5180429,1.75806517 11.9904918,1.13690224 13.5679755,0.694183299 C15.1453837,0.251464358 16.7841816,0.0301425662 18.4849735,0.0301425662 L18.4849735,0.0301425662 Z');
    }
  }

  function removeRadarLegend(){
    d3.select('.legend').remove();
  }

  function drawLegend(order) {
    removeRadarLegend();

    var triangleKey = "New or moved";
    var circleKey = "No change";

    var container = d3.select('svg').append('g')
      .attr('class', 'legend legend'+"-"+order);

    var x = 10;
    var y = 10;


    if(order == "first") {
      x = 4 * size / 5;
      y = 1 * size / 5;
    }

    if(order == "second") {
      x = 1 * size / 5 - 15;
      y = 1 * size / 5 - 20;
    }

    if(order == "third") {
      x = 1 * size / 5 - 15;
      y = 4 * size / 5 + 15;
    }

    if(order == "fourth") {
      x = 4 * size / 5;
      y = 4 * size / 5;
    }

    d3.select('.legend')
      .attr('class', 'legend legend-'+order)
      .transition()
      .style('visibility', 'visible');

    triangleLegend(x, y, container);

    container
      .append('text')
      .attr('x', x + 15)
      .attr('y', y + 5)
      .attr('font-size', '0.8em')
      .text(triangleKey);


    circleLegend(x, y + 20, container);

    container
      .append('text')
      .attr('x', x + 15)
      .attr('y', y + 25)
      .attr('font-size', '0.8em')
      .text(circleKey);
  }

  function redrawFullRadar() {
    removeHomeLink();
    removeRadarLegend();

    svg.style('left', 0).style('right', 0);

    d3.selectAll('.button')
      .classed('selected', false)
      .classed('full-view', true);

    d3.selectAll('.quadrant-table').classed('selected', false);
    d3.selectAll('.home-link').classed('selected', false);

    d3.selectAll('.quadrant-group')
      .transition()
      .duration(1000)
      .attr('transform', 'scale(1)');

    d3.selectAll('.quadrant-group .blip-link')
      .transition()
      .duration(1000)
      .attr('transform', 'scale(1)');

    d3.selectAll('.quadrant-group')
      .style('pointer-events', 'auto');
  }

  function plotRadarHeader() {
    var header = d3.select('body').insert('header', "#radar");
    header.append('div')
      .attr('class', 'radar-title')
      .append('div')
      .attr('class', 'radar-title__text')
      .append('h1')
      .text(document.title)
      .style('cursor', 'pointer')
      .on('click', redrawFullRadar);

    header.select('.radar-title')
      .append('div')
      .attr('class', 'radar-title__logo')
      .html('<a href="https://www.thoughtworks.com"> <img src="/images/logo.png" /> </a>');

    return header;
  }

  function plotQuadrantButtons(quadrants, header) {

    function addButton(quadrant) {
      radarElement
        .append('div')
        .attr('class', 'quadrant-table ' + quadrant.order);


      header.append('div')
        .attr('class', 'button ' + quadrant.order + ' full-view')
        .text(quadrant.quadrant.name())
        .on('mouseover', mouseoverQuadrant.bind({}, quadrant.order))
        .on('mouseout', mouseoutQuadrant.bind({}, quadrant.order))
        .on('click', selectQuadrant.bind({}, quadrant.order, quadrant.startAngle));
    }

    _.each([0, 1, 2, 3], function (i) {
      addButton(quadrants[i]);
    });


    header.append('div')
      .classed('print-radar button no-capitalize', true)
      .text('Print this radar')
      .on('click', window.print.bind(window));
  }

  function plotRadarFooter() {
    d3.select('body')
      .insert('div', '#radar-plot + *')
      .attr('id', 'footer')
      .append('div')
      .attr('class', 'footer-content')
      .append('p')
      .html('Powered by <a href="https://www.thoughtworks.com"> ThoughtWorks</a>. '
        + 'By using this service you agree to <a href="https://www.thoughtworks.com/radar/tos">ThoughtWorks\' terms of use</a>. '
        + 'You also agree to our <a href="https://www.thoughtworks.com/privacy-policy">privacy policy</a>, which describes how we will gather, use and protect any personal data contained in your public Google Sheet. '
        + 'This software is <a href="https://github.com/thoughtworks/build-your-own-radar">open source</a> and available for download and self-hosting.');
  }

  function mouseoverQuadrant(order) {
    d3.select('.quadrant-group-' + order).style('opacity', 1);
    d3.selectAll('.quadrant-group:not(.quadrant-group-' + order + ')').style('opacity', 0.3);
  }

  function mouseoutQuadrant(order) {
    d3.selectAll('.quadrant-group:not(.quadrant-group-' + order + ')').style('opacity', 1);
  }

  function selectQuadrant(order, startAngle) {
    d3.selectAll('.home-link').classed('selected', false);
    createHomeLink(d3.select('header'));

    d3.selectAll('.button').classed('selected', false).classed('full-view', false);
    d3.selectAll('.button.' + order).classed('selected', true);
    d3.selectAll('.quadrant-table').classed('selected', false);
    d3.selectAll('.quadrant-table.' + order).classed('selected', true);
    d3.selectAll('.blip-item-description').classed('expanded', false);

    var scale = 2;

    var adjustX = Math.sin(toRadian(startAngle)) - Math.cos(toRadian(startAngle));
    var adjustY = Math.cos(toRadian(startAngle)) + Math.sin(toRadian(startAngle));

    var translateX = (-1 * (1 + adjustX) * size / 2 * (scale - 1)) + (-adjustX * (1 - scale / 2) * size);
    var translateY = (-1 * (1 - adjustY) * (size / 2 - 7) * (scale - 1)) - ((1 - adjustY) / 2 * (1 - scale / 2) * size);

    var translateXAll = (1 - adjustX) / 2 * size * scale / 2 + ((1 - adjustX) / 2 * (1 - scale / 2) * size);
    var translateYAll = (1 + adjustY) / 2 * size * scale / 2;

    var moveRight = (1 + adjustX) * (0.8 * window.innerWidth - size) / 2;
    var moveLeft = (1 - adjustX) * (0.8 * window.innerWidth - size) / 2;

    var blipScale = 3 / 4;
    var blipTranslate = (1 - blipScale) / blipScale;

    svg.style('left', moveLeft + 'px').style('right', moveRight + 'px');
    d3.select('.quadrant-group-' + order)
      .transition()
      .duration(1000)
      .attr('transform', 'translate(' + translateX + ',' + translateY + ')scale(' + scale + ')');
    d3.selectAll('.quadrant-group-' + order + ' .blip-link text').each(function () {
      var x = d3.select(this).attr('x');
      var y = d3.select(this).attr('y');
      d3.select(this.parentNode)
        .transition()
        .duration(1000)
        .attr('transform', 'scale(' + blipScale + ')translate(' + blipTranslate * x + ',' + blipTranslate * y + ')');
    });

    d3.selectAll('.quadrant-group')
      .style('pointer-events', 'auto');

    d3.selectAll('.quadrant-group:not(.quadrant-group-' + order + ')')
      .transition()
      .duration(1000)
      .style('pointer-events', 'none')
      .attr('transform', 'translate(' + translateXAll + ',' + translateYAll + ')scale(0)');



    if (d3.select('.legend.legend-' + order).empty()){
      drawLegend(order);
    }
  }

  self.init = function () {
    radarElement = d3.select('body').append('div').attr('id', 'radar');
    return self;
  };

  self.plot = function () {
    var rings, quadrants;

    rings = radar.rings();
    quadrants = radar.quadrants();
    var header = plotRadarHeader();

    plotQuadrantButtons(quadrants, header);

    radarElement.style('height', size + 14 + 'px');
    svg = radarElement.append("svg").call(tip);
    svg.attr('id', 'radar-plot').attr('width', size).attr('height', size + 14);

    _.each(quadrants, function (quadrant) {
      var quadrantGroup = plotQuadrant(rings, quadrant);
      plotLines(quadrantGroup, quadrant);
      plotTexts(quadrantGroup, rings, quadrant);
      plotBlips(quadrantGroup, rings, quadrant);
    });

    plotRadarFooter();
  };

  return self;
};

module.exports = Radar;
