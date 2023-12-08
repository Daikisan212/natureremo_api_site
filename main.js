document.addEventListener('DOMContentLoaded', function(){

    // APIのリクエストヘッダーをセット
    const headers = new Headers({
      'Accept': 'application/json',
      'Authorization': 'Bearer WMLkk225fndPFKd3RJMyovM3HavdjeeE5wsJBhJ6qmY.RdIy-wdH1c7lZQtnB0564YfyuDblwIVHZIBGDB01_OM'
    });
  
    // APIのPOSTリクエスト時に利用する関数
    function postSend(url, params = []){
      return fetch(url, {
        method: 'Post',
        body: params,
        headers: headers
      })
      .then(function(response) {
        if(response.ok) {
          document.getElementsByClassName('light_box')[0].classList.add('flash');
          setTimeout(function() {
            document.getElementsByClassName('light_box')[0].classList.remove('flash');
          }, 1000);
          return;
        }
        throw new Error('Network response was not ok.');
      })
      .catch(function(error) {
        console.error('Error:', error);
      });
    };
  
    // APIのGETリクエスト時に利用する関数
    function getJson(url){
      return fetch(url, {
        headers: headers
      })
      .then(function(response) {
        if(response.ok) {
          return response.json();
        }
        throw new Error('Network response was not ok.');
      })
      .catch(function(error) {
        console.error('Error:', error);
      });
    };
  
  
    // エアコンの状態をセットする変数
    let acOpe; // ON・OFF
    let acMode; // モード
    let acTemp; // 温度
    let acVol; //  風量
    let acDir; //　風向
  
  
    // ページ上のエアコン表示を変更する関数
    function acNow() {
      const opeElement = document.getElementById('now_ope');
      opeElement.classList.remove('now_cool', 'now_warm', 'now_dry');
      if(acOpe == 'power-off'){
        document.getElementById('now_onoff').textContent = '停止中';
      }else{
        document.getElementById('now_onoff').textContent = '運転中';
  
        ['cool', 'warm', 'dry'].forEach(function(mode){
          if(acMode == mode){
            opeElement.classList.add('now_' + mode);
            return;
          }
        });
      }
    }
  
  
    // APIからリモコンなどのデータを取得して、利用する値を扱う関数
    function dataSet() {
      const url = 'https://api.nature.global/1/appliances';
      getJson(url)
      .then(function(dataJson) {
  
        // 家電ごとのデータをセットするループ
        for(let i = 0; i < dataJson.length; i++) {
          const type = dataJson[i]['type'];
  
          if(type == 'AC'){ // エアコンリモコンのデータ
            sessionStorage.setItem('aircon', JSON.stringify(dataJson[i]['id']));
  
            // エアコンの状態をセット
            const settings = dataJson[i]['settings'];
            acMode = settings['mode'];
            acTemp = settings['temp'];
            acVol = settings['vol'];
            acOpe = settings['button'];
  
            // エアコンのプルダウンメニューの状態を変更
            const acSettings = new Map([
                ['mode_select', acMode],
                ['temp_select', acTemp],
                ['vol_select', acVol]
            ]);
            acSettings.forEach(function(setting, id){
              const select = document.getElementById(id);
              const options = select.options ;
              for (let i = 0; i < options.length; i++){
                if(options[i].value == setting){
                  options[i].selected = true;
                  return;
                }
              }
            });
  
            // ページ上のエアコン表示を変更
            acNow();
  
          }else if(type == 'TV'){ // テレビリモコンのデータ
            sessionStorage.setItem('tv', JSON.stringify(dataJson[i]['id']));
          }else if(type == 'IR'){ // ボタン毎に登録したリモコンのデータ
            sessionStorage.setItem('ir', JSON.stringify(dataJson[i]['signals']));
          }
        }
      });
    }
    dataSet();
  
  
    // 気温を取得して表示する関数
    function tempSet(){
      const url = 'https://api.nature.global/1/devices';
      getJson(url)
      .then(function(devicesJson) {
        const now_temp = devicesJson[0]['newest_events']['te']['val'].toFixed(1);
        document.getElementById('now_temp').textContent = now_temp + '°' ;
      });
    }
    tempSet();
  
  
    let startTime = Date.now();
    let intervId;
    // ウィンドウがアクティブ時に実行させる関数
    function play() {
      intervId = setInterval(function() {
        // console.log(Date.now());
        // 変数startTimeの時刻から一定時刻後の場合
        if (Date.now() > (startTime + (30 * 60 * 1000))) {  
          // データ更新
          dataSet();
          tempSet();
          // setInterval()内で利用する時刻を更新
          startTime = Date.now();
        }
      }, 1000);
    }
    // ウィンドウが非アクティブ時に実行させる関数
    function pause() {
      clearInterval(intervId);
    }
    window.addEventListener('focus', play);
    window.addEventListener('blur', pause);
  
  
    // エアコンのリモコンを送信する関数
    function acSend(){
      // プルダウンメニューで選択中のvalueを取得
      acMode = document.getElementById("mode_select").value;
      acTemp = document.getElementById("temp_select").value;
      acVol = document.getElementById("vol_select").value;
      acDir = document.getElementById("vol_dir").value;
      // ページ上のエアコンの表示を変更
      acNow();
  
      const aircon = sessionStorage.getItem('aircon');
      const appliance = JSON.parse(aircon);
  
      let params = new URLSearchParams({
        'operation_mode': acMode,
        'temperature': acTemp,
        'air_volume': acVol,
        'air_direction': acDir
      }); 
      if(acOpe == 'power-off'){
        params.append('button', acOpe); 
      }
  
      const url = 'https://api.nature.global/1/appliances/' + appliance + '/aircon_settings';
      postSend(url, params);
    }
  
    // テレビのリモコンを送信する関数
    function tvSend(buttonName){
      const tv = sessionStorage.getItem('aircon');
      const appliance = JSON.parse(tv);
      
      const params = new URLSearchParams({
        'button': buttonName
      }); 
  
      const url = 'https://api.nature.global/1/appliances/' + appliance + '/tv';
      postSend(url, params);
    }

    // 照明のリモコンを送信する関数
    function lightSend(buttonName){
        `const light = sessionStorage.getItem();
        console.log(light)
        const appliance = JSON.parse(light);`
        
        const params = new URLSearchParams({
          'button': buttonName
        }); 
    
        const url = 'https://api.nature.global/1/appliances/' + '19e214d3-3d0c-4028-a8b0-39cb951d566f' + '/light';
        postSend(url, params);
      }
  
    // ボタン毎に登録をしたリモコンを送信する関数
    function irSend(value){
      const ir = sessionStorage.getItem('ir');
      const signals = JSON.parse(ir);

      console.log("sig",signals);
  
      function signalGet(item) {
        if (item.name == value) {
          return true;
        } 
      }
      const signal = signals.filter(signalGet);
      console.log("signal:",signal);
      const signalID = signal[0]['id'];
  
      const url = 'https://api.nature.global/1/signals/' + signalID + '/send';
      postSend(url);
    }
  
  
    // クリック・操作時に実行する関数を追加（エアコンのリモコン）
    const acButton = document.getElementsByClassName('ac');
    for(let i = 0; i < acButton.length; i++) {
      const acTag = acButton[i].tagName;
      if(acTag == 'BUTTON'){
        acButton[i].addEventListener('click', function(){
          // button要素のvalue値を取得しエアコンのオン・オフ設定にセット
          const acValue = acButton[i].value;
          acOpe = acValue;
          acSend();
        });
      }else{
        acButton[i].addEventListener('change', acSend);
      }
    }
  
    // クリック時に実行する関数を追加（TVリモコン）
    const tvButton = document.getElementsByName('tv');
    for(let i = 0; i < tvButton.length; i++) {
      tvButton[i].addEventListener('click', function(){
        const tvValue = tvButton[i].value;
        tvSend(tvValue);
      });
    }

    // クリック時に実行する関数を追加（ライト）
    const lightButton = document.getElementsByName('light');
    for(let i = 0; i < lightButton.length; i++) {
      lightButton[i].addEventListener('click', function(){
        const lightValue = lightButton[i].value;
        console.log(lightValue);
        lightSend(lightValue);
      });
    }
  
    // クリック時に実行する関数を追加（ボタン毎に登録をしたリモコン）
    const irButton = document.getElementsByName('ir');
    for(let i = 0; i < irButton.length; i++) {
      irButton[i].addEventListener('click', function(){
        const irValue = irButton[i].value;
        console.log(irValue,"aaaa");
        irSend(irValue);
      });
    }
  });