class Utils {
  formatAddress(string, size) {
    if (!string) {
      return string;
    }
    size = size || 4;
    if (string.length < size * 2 + 3) {
      return string;
    }
    return string.substring(0, size) + '...' + string.substr(-size);
  }
  sleep(seconds) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve()
      }, seconds * 1000);
    });
  }
  formatBigInt(int) {
    // eslint-disable-next-line no-undef
    return '0x' + BigInt(int).toString(16);
  }
  loadScript(script) {
    const jQuery = window.jQuery;
    return new Promise((resolve) => {
      jQuery.getScript(script).done(() => {
        resolve();
      });
    })
  }
  formatBalance(balance, decimals, delimiter) {
    if (!delimiter) {
      delimiter = 4;
    }
    if (decimals == 0) {
      // eslint-disable-next-line no-undef
      return parseInt(BigInt(parseInt(balance * 100000000))) / 100000000;
    }
    if (!decimals) {
      decimals = 18;
    }
    // eslint-disable-next-line no-undef
    return parseInt(BigInt(balance * 10 ** delimiter) / BigInt(10 ** decimals)) / (10 ** delimiter);
  }
  copyToClipboard(text) {
    if (!navigator.clipboard) {
      alert('Error');
      return;
    }
    /* Copy the text inside the text field */
    navigator.clipboard.writeText(text);
  }
  convertToCSV(objArray) {
    var array = typeof objArray != 'object' ? JSON.parse(objArray) : objArray;
    var str = '';

    for (var i = 0; i < array.length; i++) {
        var line = '';
        for (var index in array[i]) {
            if (line != '') line += ','

            line += array[i][index];
        }

        str += line + '\r\n';
    }

    return str;
  }
  exportCSVFile(headers, items, fileTitle) {
      if (headers) {
          items.unshift(headers);
      }

      // Convert Object to JSON
      var jsonObject = JSON.stringify(items);

      var csv = this.convertToCSV(jsonObject);

      var exportedFilenmae = fileTitle + '.csv' || 'export.csv';

      var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      if (navigator.msSaveBlob) { // IE 10+
          navigator.msSaveBlob(blob, exportedFilenmae);
      } else {
          var link = document.createElement("a");
          if (link.download !== undefined) { // feature detection
              // Browsers that support HTML5 download attribute
              var url = URL.createObjectURL(blob);
              link.setAttribute("href", url);
              link.setAttribute("download", exportedFilenmae);
              link.style.visibility = 'hidden';
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
          }
      }
  }
  exportJSONFile(data, file) {
    var exportedFilenmae = file + '.json' || 'export.json';
    var blob = new Blob([data], { type: 'text/json;charset=utf-8;' });
    if (navigator.msSaveBlob) { // IE 10+
      navigator.msSaveBlob(blob, exportedFilenmae);
    } else {
      var link = document.createElement("a");
      if (link.download !== undefined) { // feature detection
        // Browsers that support HTML5 download attribute
        var url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", exportedFilenmae);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    }
  }
}
export default new Utils();