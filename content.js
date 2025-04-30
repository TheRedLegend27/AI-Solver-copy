// content.js
(function() {
  let assistantActive = false;
  let minimized = false;
  let assistantContainer = null;

  // Check if extension is enabled when page loads
  chrome.storage.sync.get(['enabled'], function(data) {
    if (data.enabled) {
      initializeAssistant();
    }
  });

  // In initializeAssistant, start hidden and show only the "A" button
  function initializeAssistant() {
    if (!assistantContainer) {
      createAssistantUI();
    }
    assistantContainer.classList.add('assistant-hidden');
    createShowButton();

    if (window.location.href.includes('/quizzes/') && window.location.href.includes('/take')) {
      assistantActive = true;
      analyzeQuiz();
    }
  }

  function createAssistantUI() {
    // Create container
    assistantContainer = document.createElement('div');
    assistantContainer.className = 'assistant-container';
    
    // Create header
    const header = document.createElement('div');
    header.className = 'assistant-header';
    header.innerHTML = '<span>Study Assistant</span>';
    
    // Create minimize button
    const minimizeBtn = document.createElement('button');
    minimizeBtn.className = 'assistant-button minimize';
    minimizeBtn.textContent = '−';
    minimizeBtn.addEventListener('click', toggleMinimize);
    header.appendChild(minimizeBtn);
    
    // Create content area
    const content = document.createElement('div');
    content.className = 'assistant-content';
    content.textContent = 'Initializing...';
    
    // Create actions area
    const actions = document.createElement('div');
    actions.className = 'assistant-actions';
    
    const analyzeBtn = document.createElement('button');
    analyzeBtn.className = 'assistant-button';
    analyzeBtn.textContent = 'Analyze Quiz';
    analyzeBtn.addEventListener('click', analyzeQuiz);
    
    const hideBtn = document.createElement('button');
    hideBtn.className = 'assistant-button';
    hideBtn.textContent = 'Hide';
    hideBtn.addEventListener('click', hideAssistant);
    
    actions.appendChild(analyzeBtn);
    actions.appendChild(hideBtn);
    
    // Assemble UI
    assistantContainer.appendChild(header);
    assistantContainer.appendChild(content);
    assistantContainer.appendChild(actions);
    
    document.body.appendChild(assistantContainer);
  }

  function toggleMinimize() {
    const content = assistantContainer.querySelector('.assistant-content');
    const actions = assistantContainer.querySelector('.assistant-actions');
    const minButton = assistantContainer.querySelector('.minimize');
    
    if (minimized) {
      content.style.display = 'block';
      actions.style.display = 'flex';
      minButton.textContent = '−';
    } else {
      content.style.display = 'none';
      actions.style.display = 'none';
      minButton.textContent = '+';
    }
    
    minimized = !minimized;
  }

  // Refactor show button creation to a function
  function createShowButton() {
    // Prevent multiple buttons
    if (document.getElementById('assistant-show-btn')) return;

    const showBtn = document.createElement('button');
    showBtn.id = 'assistant-show-btn';
    showBtn.textContent = 'A';
    showBtn.style.position = 'fixed';
    showBtn.style.bottom = '10px';
    showBtn.style.right = '10px';
    showBtn.style.zIndex = '10000';
    showBtn.style.borderRadius = '50%';
    showBtn.style.width = '30px';
    showBtn.style.height = '30px';
    showBtn.style.backgroundColor = '#4CAF50';
    showBtn.style.color = 'white';
    showBtn.style.border = 'none';
    showBtn.style.cursor = 'pointer';
    showBtn.style.opacity = '0.7';

    showBtn.addEventListener('click', function() {
      assistantContainer.classList.remove('assistant-hidden');
      showBtn.remove();
    });

    document.body.appendChild(showBtn);
  }

  function hideAssistant() {
    assistantContainer.classList.add('assistant-hidden');
    createShowButton();
  }

  function updateAssistantContent(message) {
    const content = assistantContainer.querySelector('.assistant-content');
    content.innerHTML = message;
  }

  async function analyzeQuiz() {
    updateAssistantContent("Analyzing quiz questions...");
    
    try {
      // Extract quiz questions
      const questions = extractQuizQuestions();
      
      if (questions.length === 0) {
        updateAssistantContent("No quiz questions detected on this page.");
        return;
      }
      
      // Get API key from storage
      const data = await new Promise(resolve => {
        chrome.storage.sync.get(['apiKey'], resolve);
      });
      
      if (!data.apiKey) {
        updateAssistantContent("Please add your OpenAI API key in the extension settings.");
        return;
      }
      
      // Validate API key format
      // const keyPattern = /^sk-[a-zA-Z0-9]{32,}$/;
      // if (!keyPattern.test(data.apiKey.trim())) {
      //   updateAssistantContent(`<div style="color:red">Warning: Your API key doesn't look valid. It should start with "sk-" and be at least 34 characters long.</div><p>Please check your API key in the extension settings.</p>`);
      //   return;
      // }
      
      updateAssistantContent("Found " + questions.length + " questions. Analyzing...");
      
      // Process questions with AI
      const results = await processQuestionsWithAI(questions, data.apiKey);
      
      // Display results
      displayResults(questions, results);
    } catch (error) {
      updateAssistantContent("Error analyzing quiz: " + error.message);
    }
  }

  function extractQuizQuestions() {
    const questions = [];
    
    try {
      // Try different question selectors for various Canvas quiz layouts
      const selectors = [
        '.question', // Standard Canvas quiz question
        '.quiz_sortable', // Another potential Canvas format
        '.question-item', // Some Canvas instances use this
        '.question-box' // Yet another potential format
      ];
      
      let questionElements = [];
      
      // Try each selector until we find questions
      for (const selector of selectors) {
        questionElements = document.querySelectorAll(selector);
        if (questionElements.length > 0) {
          updateAssistantContent(`Found quiz questions using selector: ${selector}`);
          break;
        }
      }
      
      if (questionElements.length === 0) {
        // Try to detect any question-like elements
        const possibleQuestions = document.querySelectorAll('div[id*="question"]');
        if (possibleQuestions.length > 0) {
          questionElements = possibleQuestions;
          updateAssistantContent("Found questions using fallback method.");
        } else {
          updateAssistantContent("Could not detect question format. Please contact the developer.");
          return questions;
        }
      }
      
      // Process each question element
      questionElements.forEach((qElem, index) => {
        try {
          // Try different selectors for question text
          const textSelectors = [
            '.question_text', 
            '.display_question', 
            '.question-content',
            'div[class*="question-text"]'
          ];
          
          let questionTextElem = null;
          
          for (const selector of textSelectors) {
            questionTextElem = qElem.querySelector(selector);
            if (questionTextElem) break;
          }
          
          // If still not found, try to find any paragraph or div that might contain question text
          if (!questionTextElem) {
            questionTextElem = qElem.querySelector('p') || qElem.querySelector('div');
          }
          
          if (!questionTextElem) return;
          
          // Get question text, including any images
          let questionText = questionTextElem.textContent.trim();
          const images = questionTextElem.querySelectorAll('img');
          if (images.length > 0) {
            questionText += ' [Question contains image(s)]';
          }
          
          // Get answer choices using various selectors
          const choiceSelectors = [
            '.answer', 
            '.answer_group', 
            '.answer-option',
            'input[type="radio"]', 
            'input[type="checkbox"]'
          ];
          
          let choiceElements = [];
          
          for (const selector of choiceSelectors) {
            choiceElements = qElem.querySelectorAll(selector);
            if (choiceElements.length > 0) break;
          }
          
          const choices = [];
          
          if (choiceElements.length > 0) {
            // Process each choice element
            choiceElements.forEach(choice => {
              try {
                let choiceText = '';
                let choiceId = '';
                
                // Different ways to extract choice text
                if (choice.textContent) {
                  choiceText = choice.textContent.trim();
                } else {
                  // For input elements, try to find label
                  const inputElement = choice.tagName === 'INPUT' ? choice : choice.querySelector('input');
                  if (inputElement) {
                    choiceId = inputElement.id;
                    // Try to find associated label
                    const label = document.querySelector(`label[for="${choiceId}"]`);
                    if (label) {
                      choiceText = label.textContent.trim();
                    }
                  }
                }
                
                // If still no text but has children, use their text
                if (!choiceText && choice.children.length > 0) {
                  choiceText = Array.from(choice.children)
                    .map(child => child.textContent.trim())
                    .filter(text => text.length > 0)
                    .join(' ');
                }
                
                if (choiceText) {
                  choices.push({
                    id: choiceId,
                    text: choiceText
                  });
                }
              } catch (err) {
                console.error('Error processing choice:', err);
              }
            });
          } else {
            // Check for true/false questions
            const trueFalseInputs = qElem.querySelectorAll('input[value="true"], input[value="false"]');
            if (trueFalseInputs.length > 0) {
              choices.push({ id: 'true', text: 'True' });
              choices.push({ id: 'false', text: 'False' });
            }
            
            // Check for select dropdowns
            const selects = qElem.querySelectorAll('select');
            if (selects.length > 0) {
              selects.forEach(select => {
                Array.from(select.options).forEach(option => {
                  if (option.value && option.text) {
                    choices.push({
                      id: option.value,
                      text: option.text.trim()
                    });
                  }
                });
              });
            }
          }
          
          if (questionText) {
            questions.push({
              index: index + 1,
              text: questionText,
              choices: choices
            });
          }
        } catch (err) {
          console.error('Error processing question:', err);
        }
      });
    } catch (err) {
      console.error('Error extracting questions:', err);
      updateAssistantContent(`Error extracting questions: ${err.message}`);
    }
    
    return questions;
  }

  async function processQuestionsWithAI(questions, apiKey) {
    // Get model choice and delay settings
    const data = await new Promise(resolve => {
      chrome.storage.sync.get(['modelChoice', 'delayBetweenQuestions'], resolve);
    });
    
    const modelChoice = data.modelChoice || 'gpt-4';
    const delayBetweenQuestions = parseInt(data.delayBetweenQuestions || 1000);
    const results = [];
    updateAssistantContent("Processing questions with rate limiting...");
    
    // Process questions one at a time with delay to avoid rate limiting
    for (const question of questions) {
      try {
        updateAssistantContent(`Processing question ${question.index} of ${questions.length}...`);
        
        // Prepare prompt for AI
        const prompt = createPromptForQuestion(question);
        
        // Function to retry API calls with exponential backoff
        const callAPIWithRetry = async (retryCount = 0, delay = 2000) => {
          try {
            // Call OpenAI API
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
              },
              body: JSON.stringify({
                model: modelChoice,
                messages: [
                  {
                    role: "system",
                    content: "You are a knowledgeable tutor helping a student study. Your task is to analyze quiz questions and provide ONLY the most likely correct answer. Respond with just the answer letter or text, nothing else."
                  },
                  {
                    role: "user",
                    content: prompt
                  }
                ],
                temperature: 0.3
              })
            });
            
            if (response.status === 429 && retryCount < 3) {
              // If rate limited, wait and retry with exponential backoff
              const waitTime = delay * Math.pow(2, retryCount);
              updateAssistantContent(`Rate limited. Waiting ${waitTime/1000} seconds before retrying...`);
              await new Promise(resolve => setTimeout(resolve, waitTime));
              return callAPIWithRetry(retryCount + 1, delay);
            }
            
            if (!response.ok) {
              throw new Error(`API request failed with status ${response.status}`);
            }
            
            return await response.json();
          } catch (error) {
            if (retryCount < 3) {
              const waitTime = delay * Math.pow(2, retryCount);
              updateAssistantContent(`Error: ${error.message}. Retrying in ${waitTime/1000} seconds...`);
              await new Promise(resolve => setTimeout(resolve, waitTime));
              return callAPIWithRetry(retryCount + 1, delay);
            }
            throw error;
          }
        };
        
        // Call API with retry logic
        const data = await callAPIWithRetry();
        
        results.push({
          questionIndex: question.index,
          analysis: data.choices[0].message.content
        });
        
        // Add a delay between questions to avoid rate limiting
        if (question.index < questions.length) {
          updateAssistantContent(`Waiting ${delayBetweenQuestions/1000} seconds before next question...`);
          await new Promise(resolve => setTimeout(resolve, delayBetweenQuestions));
        }
        
      } catch (error) {
        results.push({
          questionIndex: question.index,
          analysis: `Error analyzing this question: ${error.message}`
        });
      }
    }
    
    return results;
  }

  function createPromptForQuestion(question) {
    let prompt = `Question ${question.index}: ${question.text}\n\nAnswer choices:\n`;
    question.choices.forEach((choice, i) => {
      prompt += `${String.fromCharCode(65 + i)}. ${choice.text}\n`;
    });
    prompt += "\nRespond with only the letter or text of the most likely correct answer. Do not explain.";
    return prompt;
  }

  function displayResults(questions, results) {
    let content = '<h3>Quiz Analysis</h3>';
    
    results.forEach(result => {
      const question = questions.find(q => q.index === result.questionIndex);
      
      content += `<div style="margin-bottom: 20px;">
        <strong>Question ${result.questionIndex}:</strong> ${question.text.substring(0, 100)}${question.text.length > 100 ? '...' : ''}
        <div class="assistant-answer">
          ${result.analysis.replace(/\n/g, '<br>')}
        </div>
      </div>`;
    });
    
    updateAssistantContent(content);
  }
})();