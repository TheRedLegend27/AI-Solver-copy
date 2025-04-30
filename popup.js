// popup.js
document.addEventListener('DOMContentLoaded', function() {
  // Load saved settings
  chrome.storage.sync.get(['enabled', 'apiKey', 'modelChoice', 'delayBetweenQuestions'], function(data) {
    document.getElementById('enableAssistant').checked = data.enabled || false;
    document.getElementById('apiKey').value = data.apiKey || '';
    
    // Set model choice if it exists
    if (document.getElementById('modelChoice')) {
      document.getElementById('modelChoice').value = data.modelChoice || 'gpt-4';
    }
    
    // Set delay between questions if it exists
    if (document.getElementById('delayBetweenQuestions')) {
      document.getElementById('delayBetweenQuestions').value = data.delayBetweenQuestions || '3000';
    }
  });

  // Save settings
  document.getElementById('saveSettings').addEventListener('click', function() {
    const enabled = document.getElementById('enableAssistant').checked;
    const apiKey = document.getElementById('apiKey').value;
    
    // Get optional settings if they exist
    const modelChoice = document.getElementById('modelChoice') ? 
                        document.getElementById('modelChoice').value : 'gpt-3.5-turbo';
    const delayBetweenQuestions = document.getElementById('delayBetweenQuestions') ? 
                                  document.getElementById('delayBetweenQuestions').value : '1000';
    
    chrome.storage.sync.set({
      'enabled': enabled,
      'apiKey': apiKey,
      'modelChoice': modelChoice,
      'delayBetweenQuestions': delayBetweenQuestions
    }, function() {
      const status = document.getElementById('status');
      status.textContent = 'Settings saved!';
      setTimeout(function() {
        status.textContent = '';
      }, 2000);
    });
  });
  
  // Add API key validation
  // document.getElementById('apiKey').addEventListener('blur', function() {
  //   const apiKey = this.value.trim();
  //   const keyPattern = /^sk-[a-zA-Z0-9]{48,}$/;
    
  //   if (apiKey && !keyPattern.test(apiKey)) {
  //     const status = document.getElementById('status');
  //     status.textContent = 'Warning: API key format looks incorrect.';
  //     status.style.color = 'orange';
  //   }
  // });
});