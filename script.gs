/*
程式原創：阿簡生物筆記
程式初版：溪湖高中註冊組童冠傑
        高雄高工註冊組王昇豐
        花蓮女中註冊組張家誠
*/

// 全域變數
ver = '3.1415926'; // 程式版本
ver_date = '113.05.14'; // 程式版本日期


// 在試算表功能選單中顯示小幫手功能
function onOpen() {
  SpreadsheetApp.getUi().createMenu('小幫手').addItem('取得雲端硬碟檔案連結', 'get_all_files_url').addToUi();
}

/*
  函式名稱：部署為網頁應用程式html插入檔案函式
  參數說明：filename - 要插入的HTML檔案名稱
*/
function include(filename){
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

// doGet是第一個要被執行的function。使網頁在執行時可以找到進入點(首頁)
function doGet(e){
  // 獲取設定工作表
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('設定');
  //處理自動登入用變數
  userGmail = Session.getActiveUser().getEmail(); //抓取使用者的google帳號
  gmailStatus = '';
  withGoogle = ''; //預設為空值
  // 引入設定
  var error = 0;
  var source = checkSheet(); // 檢查設定工作表
  // 回傳設定工作表是否有錯誤
  if(source == -2){
    error++;
    var p = HtmlService.createTemplateFromFile('error');
    errorMessage = '設定工作表遺失<br />可能是被刪除或更名';
  }
  // 沒有前置的錯誤，開始輸出畫面
  if(error == 0){
    var p = HtmlService.createTemplateFromFile('index');
    // 所有資料正確無誤時，將各項設定參數帶去給頁面
    s = source[0];
    t = source[1];
    st = source[2];
    //處理系統開放與否
    var openTime = sheet.getRange(34, 2).getValue(); // 開放時間
    var closeTime = sheet.getRange(35, 2).getValue(); // 關閉時間
    // 獲取當前時間
    var now = new Date();
    // 檢查當前時間是否在開放和關閉時間之間
    var isOpen = checkTimeValidity(now, s['系統開放時間'], s['系統關閉時間']);
    if (!isOpen) {
      // 如果不在開放時間內，返回一個提示頁面
      return HtmlService.createHtmlOutput('<p><H1 style= "text-align:center">您好，此時段尚未開放查詢。</H1></p>');
    }
    // 檢查當前時間是否在指定的開放和關閉時間之間
    function checkTimeValidity(now, openTime, closeTime) {
      // 將開放和關閉時間轉換為 Date 對象，以便比較
      var openDateTime = new Date(openTime);
      var closeDateTime = new Date(closeTime);
      return now >= openDateTime && now <= closeDateTime;
    }
    // 學校名稱
    if(s['學校名稱']){
      schoolName = s['學校名稱'];
      var sp = st.getRange(t['學校名稱'], 2); // 取得學校名稱的位置
      schoolNameFontFamily = sp.getFontFamily();
      schoolNameColor = sp.getFontColorObject().asRgbColor().asHexString();
      schoolNameFontWeight = sp.getFontWeight();
    }else{
      var p = HtmlService.createTemplateFromFile('error');
      schoolName = '';
      errorMessage = '學校名稱未填寫';
    }
    // 系統名稱
    if(s['系統名稱']){
      systemName = s['系統名稱'];
      var sp = st.getRange(t['系統名稱'], 2); // 取得系統名稱的位置
      systemNameFontFamily = sp.getFontFamily();
      systemNameColor = sp.getFontColorObject().asRgbColor().asHexString();
      systemNameFontWeight = sp.getFontWeight();
    }else{
      var p = HtmlService.createTemplateFromFile('error');
      systemName = '';
      errorMessage = '系統名稱未填寫';
    }
    // 整體字體與基本尺寸
    fontFamily = st.getRange(t['系統預設字型'], 2).getValues();
    // 登入頁面項目標題的顏色
    loginTitleColor = st.getRange(t['首頁登入標題顏色'], 2).getBackground();
    fontSizePlaceholder = st.getRange(t['欄位提示語字體大小'], 2).getValues();
    if(fontSizePlaceholder == '') fontSizePlaceholder = 14; // 未填寫尺寸，預設為14號字
    serviceUrl = ScriptApp.getService().getUrl();
    //協助架設者設定「表單提交觸發條件」
    var allTriggers = ScriptApp.getProjectTriggers(); //取得腳本設定的觸發條件
    if(allTriggers.length == 0){
      //一個都沒有的情況下，協助自動設定
      ScriptApp.newTrigger("changeCode")
               .forSpreadsheet(source[3])
               .onFormSubmit()
               .create()
    }
    //處理驗證碼表單的部分，必須將表單與本試算表連結
    vCode = '';
    formUrl = source[3].getFormUrl();
    if(s['啟用變更驗證碼'] == '啟用' && formUrl != null){
      //有啟用
      vCode = `<input type="button" value="變更驗證碼" onclick="window.open('${formUrl}', '_blank');">`;
    }else{
      if(s['啟用變更驗證碼'] == '啟用' && formUrl == null){
        st.getRange(t['啟用變更驗證碼'], 2).setValue('關閉');
      }
    }
    //處理自動登入
    if(s['啟用mail自動登入'] == '啟用' && userGmail){
      var imageId = '';
      //取得使用者是否授權自動登入
      gmailStatus = `<tr><td class="hint" colspan="2">目前登入帳號：${userGmail}</td></tr>`;
      //此圖放置於php-pie私人建置之伺服器中，可以替換成您自己的網路圖片
      //取得與試算表同目錄下檔名為「一鍵登入圖片」的圖片
      var ssId = SpreadsheetApp.getActive().getId(); //取得此試算表的ID
      var file = DriveApp.getFileById(ssId); //取得試算表檔案
      var folder = file.getParents().next(); //取得試算表所在的資料夾
      var files = folder.getFiles(); //取得資料夾項下的檔案們
      while(files.hasNext()){
        var file = files.next();
        var filename = file.getName().split('.');
        var type = file.getMimeType().split('/');
        if(filename[0] == '一鍵登入圖檔' & type[0] == 'image'){
          var imageId = file.getId(); //將試算表ID宣告成全域變數
          break;
        }
      }
      if(imageId){
        var image = `<a href="${ScriptApp.getService().getUrl()}?page=authorize"><img alt="一鍵登入" title="一鍵登入" width="240" src="https://drive.google.com/thumbnail?id=${imageId}"></a>`;
      }else{
        var image = `<a href="${ScriptApp.getService().getUrl()}?page=authorize">一鍵登入</a>`;
      }
      withGoogle = image +
      `<div style="font-size: 10pt; width: 240px; color: gray;">Google帳號授權登入說明` +
      `<div style="font-size: 10pt; width: 240px; color: gray; text-align: left;">使用Chorme登入Google帳號，請利用此功能快速一鍵登入。<br />建議使用公用電腦時，使用後請務必登出Google帳號，以避免他人盜用資料。</div>` +
      ``;
    }
    //處理自動登入
    if(e.parameter.page == 'authorize'){
      return authorize();
    }
  }else{
    // 錯誤訊息頁面的最基本資料
    schoolName = '';
    systemName = '系統自動偵測功能';
  }
  return p.evaluate().setTitle(schoolName + systemName).addMetaTag('viewport', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0');
}

//表單提交，item6為驗證碼專屬
function doPost(e){
  var item1 = e.parameter.item1;
  var item2 = e.parameter.item2;
  var item3 = e.parameter.item3;
  var item4 = e.parameter.item4;
  var item5 = e.parameter.item5;
  var item6 = e.parameter.item6;
  ss = SpreadsheetApp.getActive();
  st = ss.getSheetByName('資料庫');
  if(st != null){
    //製作登入的「合成碼」欄位
    var user = item1 + item2 + item3 + item4 + item5 + item6;
    var data = st.getRange(1,1, st.getLastRow(),1).getValues();
    var list = data.map(function(r){ return r[0]; });
    if (list.indexOf(user) > -1){
      return result(list.indexOf(user));
    }
    var p = HtmlService.createTemplateFromFile('error');
    errorMessage = '查無此人或驗證碼錯誤<p style="color: red;">請回上一頁重新輸入</p>';
  }else{
    var p = HtmlService.createTemplateFromFile('error');
    errorMessage = '<p><b style="color: forestgreen;">程式自動檢測</b></p>「資料庫」工作表遺失<br />可能是被刪除或更名<p style="color: red;">請洽系統管理人員</p>';
  }
  return p.evaluate().setTitle('資料查詢下載系統').addMetaTag('viewport', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0');
}

//驗證與結果輸出
function result(position){
  ss = SpreadsheetApp.getActive();
  dataSheet = ss.getSheetByName('資料庫');
  //回傳設定工作表是否有錯誤
  if(dataSheet == null){
    error++;
    var p = HtmlService.createTemplateFromFile('error');
    errorMessage = '<p><b style="color: forestgreen;">程式自動檢測</b></p>設定工作表遺失<br />可能是被刪除或更名<p style="color: red;">請洽系統管理人員</p>';
  }else{
    var data = dataSheet.getDataRange().getValues();
    var error = 0;
    var source = checkSheet();
    //回傳欄位是否有錯誤
    if(source.length == 2){
      error++;
      var p = HtmlService.createTemplateFromFile('error');
      errorMessage = source[1];
    }
  }
  //沒有前置的錯誤，開始輸出畫面
  if(error == 0){
    var template = HtmlService.createTemplateFromFile('result.html');
    template.position = position;
    s = source[0];
    t = source[1];
    st = source[2];
    //學校名稱
    if(s['學校名稱']){
      schoolName = s['學校名稱'];
      var sp = st.getRange(t['學校名稱'], 2); //取得學校名稱的位置
      schoolNameFontFamily = sp.getFontFamily();
      schoolNameColor = sp.getFontColorObject().asRgbColor().asHexString();
      schoolNameFontWeight = sp.getFontWeight();
    }else{
      var p = HtmlService.createTemplateFromFile('error');
      schoolName = '';
      errorMessage = '學校名稱未填寫';
    }
    //系統名稱
    if(s['系統名稱']){
      systemName = s['系統名稱'];
      var sp = st.getRange(t['系統名稱'], 2); //取得系統名稱的位置
      systemNameFontFamily = sp.getFontFamily();
      systemNameColor = sp.getFontColorObject().asRgbColor().asHexString();
      systemNameFontWeight = sp.getFontWeight();
    }else{
      var p = HtmlService.createTemplateFromFile('error');
      systemName = '';
      errorMessage = '系統名稱未填寫';
    }
    //整體字體與基本尺寸
    fontFamily = st.getRange(t['系統預設字型'], 2).getValues();
    //查詢頁面的版面樣式
    bsLabelColor = st.getRange(t['查詢結果基本資料標題顏色'], 2).getBackground();
    bsFontColor = st.getRange(t['查詢結果基本資料內容顏色'], 2).getBackground();
    bsBGColor = st.getRange(t['查詢結果基本資料表格底色'], 2).getBackground();
    qryLBGColorDefault = st.getRange(t['查詢結果表格左欄底色'], 2).getBackground(); //查詢資料左側表格「預設」底色
    qryLFontColorDefault = ''; //查詢資料左側表格「預設」字體顏色
    qryRBGColorDefault = ''; //查詢資料右側表格「預設」底色
    qryRFontColorDefault = ''; //查詢資料右側表格「預設」字體顏色

    template.studentNumber = data[position][8]; //學號
    template.className = data[position][9]; //班級座號
    template.studentName = data[position][10]; //學生姓名
    result = template.evaluate().setTitle( schoolName + systemName).addMetaTag('viewport', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0');
    for(var j　=　10; j < data[0].length; j++){
      //欄位屬於公開、有內容才處理
      if(data[0][j] == '公開' && data[position][j].toString() != ''){
        //恢復預設
        qryLBGColor = qryLBGColorDefault;
        qryLFontColor = qryLFontColorDefault;
        qryRBGColor = qryRBGColorDefault;
        qryRFontColor = qryRFontColorDefault;
        //取得查詢資料標題儲存格的樣式
        var titleBGColor = dataSheet.getRange(2 , j + 1).getBackground();
        if(titleBGColor != '#ffffff') qryLBGColor = titleBGColor;
        var titleFontColor = dataSheet.getRange(2 , j + 1).getFontColorObject().asRgbColor().asHexString();
        if(titleFontColor != '#ff000000') qryLFontColor = titleFontColor;
        var qryLFontWeight = dataSheet.getRange(2 , j + 1).getFontWeight();
        //取得查詢資料內容儲存格的樣式
        var dataBGColor = dataSheet.getRange(position + 1 , j + 1).getBackground();
        if(dataBGColor != '#ffffff') qryRBGColor = dataBGColor;
        var dataFontColor = dataSheet.getRange(position + 1 , j + 1).getFontColorObject().asRgbColor().asHexString();
        if(dataFontColor != '#ff000000') qryRFontColor = dataFontColor;
        var qryRFontWeight = dataSheet.getRange(position + 1 , j + 1).getFontWeight();
        result.append('<tr class="bs"><td style="font-weight: ' + qryLFontWeight + '; color: ' + qryLFontColor + '; background-color: ' + qryLBGColor + ';vertical-align:middle;">' + data[1][j] + '</td>');
        if (data[position][j].toString().startsWith("https://docs.google.com/forms/")){
          //表單模式
          var qryData = '<a target="_blank" rel="noreferrer noopenner" href="' + data[position][j] + '">填寫表單</a>';
        }else if (data[position][j].toString().startsWith("https://") || data[position][j].toString().startsWith("http://")){
          //檔案連結模式
          var qryData = '<a target="_blank" rel="noreferrer noopenner" href="' + data[position][j] + '">檔案下載</a>';
        }else{
          //文字模式
          if(data[position][j].toString() == 'true' || data[position][j].toString() == 'false'){
            var tf = s['true 與 false 的顯示用語'].split(',');
            if(data[position][j]){
              var qryData = tf[0];
            }else{
              var qryData = tf[1];
            }
          }else{
            var qryData = data[position][j];
          }
        }
        result.append('<td class="bs" style="font-weight: ' + qryRFontWeight + '; color: ' + qryRFontColor + '; background-color: ' + qryRBGColor + ';">' + qryData + '</td></tr>');
      }
    }
    result.append('</table>');
    result.append('<p><label class="three">資料若有問題，請洽系統管理人員</label></p>');
    result.append('</center></body></html>');
    return result;
  }else{
    //錯誤訊息頁面的最基本資料
    schoolName = '';
    systemName = '系統自動偵測功能';
    return p.evaluate().setTitle(schoolName + systemName).addMetaTag('viewport', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0');
  }
}

//處理自動登入
function authorize(){
  var ss = SpreadsheetApp.getActive();
  var st = ss.getSheetByName('資料庫');
  if(st == null){
    var p = HtmlService.createTemplateFromFile('error');
    errorMessage = '<p><b style="color: forestgreen;">程式自動檢測</b></p>「資料庫」工作表遺失<br />可能是被刪除或更名<p style="color: red;">請洽系統管理人員</p>';
  }else{
    var data = st.getRange(1,8, st.getLastRow(),2).getValues();
    var mailList = data.map(function(r){ return r[0]; });
    var pos = mailList.indexOf(userGmail);
    if (pos > -1){
      return result(pos);
    }else{
      //非本資料庫中人員或為登入google
      var p = HtmlService.createTemplateFromFile('error');
      errorMessage = `<p><b style="color: forestgreen;">自動登入授權失敗，可能：</b></p>尚未登入Google<br />資料庫中無此信箱帳號<p><p style="color: red;">檢查後，請重新同意授權<p><a href="${ScriptApp.getService().getUrl()}">回上一頁</a></p>`;
    }
  }
  return p.evaluate().setTitle('資料查詢下載系統').addMetaTag('viewport', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0');
}

//變更驗證碼
function changeCode(event){
  //取得資料庫工作表中所有的資料  
  var ss = SpreadsheetApp.getActive();
  var st = ss.getSheetByName('資料庫');
  var data = st.getDataRange().getValues();
  // 表單提交之後，表單內容會以陣列方式寫入event中
  // formData[0] 會是表單填寫的時間戳記
  // formData[1] 開始才會是表單各欄位的資料  
  var formData = event.values;
  //不管使用者第幾次提叫忘記密碼（修改驗證碼），就是用取得的時間戳記來處理即可，檢查忘記密碼工作表哪些筆資料符合這個最新的時間戳記，凡是符合的就檢查資料庫工作表有沒有相對應電子郵件的使用者，有的話將驗證碼替換掉就完成了
  var codeSs = SpreadsheetApp.getActive();
  var codeSt = codeSs.getSheetByName('驗證碼'); //取得忘記密碼工作表
  var code = codeSt.getDataRange().getValues();
  //從第2列開始檢查，請留意陣列是0起算，儲存格座標是1起算
  for(var i = 1; i < code.length; i++){
    var t = formData[0].split(' ');
    //先將表單的時間戳記進行整理，因為上下午中文的關係，造成無法宣告為時間
    var newT = t[0] + ' ' + t[2];
    if(t[1] == '上午'){
      newT = newT + ' AM';
    }else{
      newT = newT + ' PM';
    }
    //如果有使用者的時間戳記與表單送來的最新時間戳記相符，那這一筆就是熱騰騰的忘記密碼申請請求了
    //表單提交時的時間戳記與儲存格的時間戳記有1秒內的誤差，所以只要誤差在1.5秒內的都視為新的申請
    if(Math.abs(new Date(newT).getTime() - code[i][0].getTime()) < 1500){
      //比對資料庫工作表是否有相同的電子信箱使用者，有的話就將驗證碼替換之
      for(var j = 1; j < data.length; j++){
        //兩個工作表中的電子信箱相符，所以將新的驗證碼寫過去
        if(code[i][1] == data[j][7]){
          st.getRange(j + 1, 7).setValue(code[i][2]);
        }
      }
    }
  }
}

//以下為小幫手的函式
function get_all_files_url(){
  var ss = SpreadsheetApp.getActive();
  var url = SpreadsheetApp.getUi().prompt("請填入雲端硬碟中資料夾的網址");
  var directoryId;
  
  if ((url.getResponseText().split("/folders/")[1] === null) | (url.getResponseText().split("/folders/")[1].split("?")[0])){
    SpreadsheetApp.getUi().alert("請重新輸入資料夾的網址");
  }else{
    // directoryId = url.getResponseText().match(/folders\/(.*)(\?)?/)[1];
    directoryId = url.getResponseText().split("/folders/")[1].split("?")[0];
    var directory = DriveApp.getFolderById(directoryId);
    var folders = directory.getFolders();

    // 建立新的試算表
    var sheet_name = directory.getName() + Utilities.formatDate(new Date(), "GMT+8", "MMddHHmm").toString();
    ss.insertSheet(sheet_name,ss.getNumSheets()+1);
    var export_sheet = ss.getSheetByName(sheet_name);
    export_sheet.setFrozenRows(1);
    export_sheet.getRange(1,1,1,1).setValue("檔案名稱");
    export_sheet.getRange(1,2,1,1).setValue("檔案預覽連結");
    export_sheet.getRange(1,3,1,1).setValue("檔案下載連結");

    files = directory.getFiles();
    files_url_output(sheet_name, files)

    while (folders.hasNext()) {
      var folder = folders.next();
      var files = folder.getFiles();
      files_url_output(sheet_name, files)
    }
  }
}

//擷取雲端檔案函式
function files_url_output(sheet_name, files){
  var ss = SpreadsheetApp.getActive();
  var export_sheet = ss.getSheetByName(sheet_name);
  while (files.hasNext()){
    var file = files.next();
    var lastRow = export_sheet.getLastRow();
    export_sheet.getRange(lastRow+1, 1, 1, 1).setValue(file.getName());
    export_sheet.getRange(lastRow+1, 2, 1, 1).setValue(file.getUrl());
    export_sheet.getRange(lastRow+1, 3, 1, 1).setValue(file.getDownloadUrl());
  }
}

/* 延伸函式區 */
/*
  函式名稱：檢查工作表們
  參數說明：無
  傳回值：
    正確：
      [0]設定工作表的陣列
      [1]設定工作表的欄位標題的位置(數字)；解決整列被使用者搬動位置的問題
      [2]設定工作表sheet
      [3]試算表spreadsheet
    錯誤：
      -2設定工作表不存在
      [-3, errorMessage]設定工作表欄位有問題；長度為2的陣列
*/
function checkSheet(){
  var ss = SpreadsheetApp.getActive();
  //檢查「設定」工作表是否存在
  var sst = ss.getSheetByName('設定');
  if(sst == null){
    return -2; //傳回錯誤值
  }
  //檢查「設定」工作表的欄位是否缺漏
  var titleError = '';
  var t = sst.getSheetValues(1, 1, sst.getLastRow(), 1).map(function(r){ return r[0]; }); //取得欄位名稱
  if(t.indexOf('學校名稱') < 0) titleError = '缺少「學校名稱」欄位<br />';
  if(t.indexOf('系統名稱') < 0) titleError = titleError + '缺少「系統名稱」欄位<br />';
  if(t.indexOf('首頁登入第1項標題') < 0) titleError = titleError + '缺少「首頁登入第1項標題」欄位<br />';
  if(t.indexOf('首頁登入第2項標題') < 0) titleError = titleError + '缺少「首頁登入第2項標題」欄位<br />';
  if(t.indexOf('首頁登入第3項標題') < 0) titleError = titleError + '缺少「首頁登入第3項標題」欄位<br />';
  if(titleError){
    return [-3, '設定工作表中：<br />' + titleError]; //傳回值
    /*
    sst.activate();
    Browser.msgBox('錯誤訊息', '「設定」工作表的欄位錯誤，可能被刪除或更名：\\n\\n' + titleError, Browser.Buttons.OK); //訊息視窗
    return -3; //傳回錯誤值
    */
  }
  //製作「設定」工作表回傳用的陣列
  var v = sst.getSheetValues(1, 2, sst.getLastRow(), 1).map(function(r){ return r[0]; }); //取得第2行的資料
  //製作「設定」工作表有鍵值的陣列回傳
  var s = [];
  var sa = [];
  for(var i = 0 ; i < t.length; i++){
    s[t[i]] = v[i];
    sa[t[i]] = i + 1;
  }
  return [s, sa, sst, ss]; //傳回值
}
