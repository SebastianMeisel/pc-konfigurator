"use strict";

let questionBank=[];
let TEST_SIZE=20;
const letters=["A","B","C","D"];
const reducedMotion=window.matchMedia("(prefers-reduced-motion: reduce)").matches;
let activeQuestions=[],answers=[],currentIndex=0;
const $=selector=>document.querySelector(selector);
const escapeHtml=value=>String(value).replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));

function randomValue(){
  if(globalThis.crypto&&typeof globalThis.crypto.getRandomValues==="function"){
    const value=new Uint32Array(1);globalThis.crypto.getRandomValues(value);return value[0]/4294967296;
  }
  return Math.random();
}
function shuffle(values){
  const result=[...values];
  for(let index=result.length-1;index>0;index-=1){
    const swapIndex=Math.floor(randomValue()*(index+1));
    [result[index],result[swapIndex]]=[result[swapIndex],result[index]];
  }
  return result;
}
function prepareQuestion(question){
  const options=shuffle(question.options.map(option=>({
    ...option,
    isCorrect:option.id===question.correctAnswer
  })));
  return {...question,options,correctIndex:options.findIndex(option=>option.isCorrect)};
}
function answerFromChoice(question,selectedId){
  const selectedOption=question.options.find(option=>option.id===selectedId);
  const correctOption=question.options[question.correctIndex];
  if(!selectedOption||!correctOption)return null;
  return{question,selectedId,selectedText:selectedOption.text,correctText:correctOption.text,explanation:correctOption.feedback,isCorrect:selectedOption.isCorrect};
}
function quizSession(){
  return{
    ids:activeQuestions.map(question=>question.id),
    choices:answers.map(answer=>answer.selectedId)
  };
}
function updateProgress(){
  const answered=answers.length,position=Math.min(currentIndex+1,TEST_SIZE);
  $("#progress-text").textContent="Frage "+position+" von "+TEST_SIZE;
  $("#score-text").textContent=answers.filter(answer=>answer.isCorrect).length+" richtig";
  $("#progress-fill").style.width=answered/TEST_SIZE*100+"%";
  $("#progress-track").setAttribute("aria-valuenow",String(answered));
  $("#progress-track").setAttribute("aria-valuetext",answered+" von "+TEST_SIZE+" Fragen beantwortet");
}
function renderQuestion(focusQuestion=true){
  const question=activeQuestions[currentIndex];
  $("#question-number").textContent=String(currentIndex+1).padStart(2,"0");
  $("#question-category").textContent=question.category;
  $("#question-heading").textContent=question.question;
  $("#hint-text").textContent=question.hint;
  $("#question-hint").open=false;
  $("#answer-list").innerHTML=question.options.map((option,index)=>
    '<label class="answer-option" data-option="'+index+'"><input type="radio" name="answer" value="'+index+'"><span class="answer-letter" aria-hidden="true">'+letters[index]+'</span><span class="answer-text">'+escapeHtml(option.text)+'</span></label>'
  ).join("");
  $("#feedback").hidden=true;$("#feedback").className="feedback";$("#feedback").textContent="";
  $("#submit-answer").hidden=false;$("#submit-answer").disabled=true;$("#next-question").hidden=true;
  $("#next-question").textContent=currentIndex===TEST_SIZE-1?"Test auswerten":"Nächste Frage";
  updateProgress();
  if(focusQuestion){
    $("#question-heading").focus({preventScroll:true});
    $("#quiz-panel").scrollIntoView({behavior:reducedMotion?"auto":"smooth",block:"start"});
  }
}
function submitAnswer(event){
  event.preventDefault();
  const selectedInput=document.querySelector('input[name="answer"]:checked');
  if(!selectedInput)return;
  const question=activeQuestions[currentIndex],selectedIndex=Number(selectedInput.value);
  const selectedOption=question.options[selectedIndex],correctOption=question.options[question.correctIndex];
  answers.push({question,selectedId:selectedOption.id,selectedText:selectedOption.text,correctText:correctOption.text,explanation:correctOption.feedback,isCorrect:selectedOption.isCorrect});
  document.querySelectorAll('input[name="answer"]').forEach(input=>{
    input.disabled=true;
    const label=input.closest(".answer-option"),optionIndex=Number(input.value);
    if(optionIndex===question.correctIndex)label.classList.add("correct");
    if(input.checked&&!selectedOption.isCorrect)label.classList.add("wrong");
  });
  const feedback=$("#feedback");
  feedback.classList.toggle("wrong",!selectedOption.isCorrect);
  feedback.innerHTML="<strong>"+(selectedOption.isCorrect?"Richtig.":"Noch nicht richtig.")+"</strong> "+(!selectedOption.isCorrect?"Die richtige Antwort lautet: "+escapeHtml(correctOption.text)+". ":"")+escapeHtml(selectedOption.feedback);
  feedback.hidden=false;$("#submit-answer").hidden=true;$("#next-question").hidden=false;updateProgress();
  window.BuildBenchLMS?.recordQuizProgress({
    answered:answers.length,
    total:TEST_SIZE,
    score:answers.filter(answer=>answer.isCorrect).length,
    session:quizSession()
  });
  $("#next-question").focus();
}
function resultGrade(score){
  const ratio=score/TEST_SIZE;
  if(ratio>=.85)return{label:"sehr sicher",color:"var(--accent)",text:"Du beherrschst die Grundlagen sehr sicher und kannst die meisten Begriffe korrekt einordnen."};
  if(ratio>=.7)return{label:"sicher",color:"#77a8ff",text:"Du verfügst über eine gute Grundlage. Wiederhole einzelne Themen anhand der Nachbesprechung."};
  if(ratio>=.5)return{label:"teilweise sicher",color:"var(--warning)",text:"Viele Grundlagen sitzen bereits. Nutze Hinweise und Begründungen, um Lücken gezielt zu schließen."};
  return{label:"noch ausbaufähig",color:"var(--danger)",text:"Arbeite die schwächeren Themen im Konfigurator und in den Lernkarten noch einmal durch."};
}
function renderResults(reportToLms=true){
  const score=answers.filter(answer=>answer.isCorrect).length,percent=Math.round(score/TEST_SIZE*100),grade=resultGrade(score),categoryMap=new Map();
  answers.forEach(answer=>{
    const entry=categoryMap.get(answer.question.category)||{total:0,correct:0};
    entry.total+=1;if(answer.isCorrect)entry.correct+=1;categoryMap.set(answer.question.category,entry);
  });
  const categories=[...categoryMap.entries()].sort((a,b)=>(a[1].correct/a[1].total)-(b[1].correct/b[1].total)||a[0].localeCompare(b[0],"de"));
  const weakest=categories[0];
  $("#quiz-panel").hidden=true;$("#result-panel").hidden=false;$("#result-score").textContent=score;
  $("#result-summary").textContent=score+" von "+TEST_SIZE+" Fragen richtig ("+percent+" %): "+grade.text;
  $("#result-ring").style.setProperty("--result-percent",String(percent));$("#result-ring").style.setProperty("--ring-color",grade.color);
  $("#result-ring").setAttribute("aria-label",score+" von "+TEST_SIZE+" Fragen richtig; Kenntnisstand "+grade.label+".");
  $("#category-results").innerHTML=categories.map(([category,result])=>{
    const value=Math.round(result.correct/result.total*100);
    return '<div class="category-result"><span>'+escapeHtml(category)+'</span><span class="mini-track" aria-hidden="true"><span style="width:'+value+'%"></span></span><strong>'+result.correct+" / "+result.total+"</strong></div>";
  }).join("");
  const weakText=weakest&&weakest[1].correct<weakest[1].total?"Beginne mit <strong>"+escapeHtml(weakest[0])+"</strong>. Dort wurden "+weakest[1].correct+" von "+weakest[1].total+" Fragen richtig beantwortet.":"In allen vorkommenden Themen wurden sämtliche Fragen richtig beantwortet.";
  $("#recommendation").innerHTML=weakText+" Begründe anschließend jede richtige Lösung noch einmal mit eigenen Worten.";
  $("#review-list").innerHTML=answers.map((answer,index)=>
    '<details class="review-item"><summary><span class="review-state'+(answer.isCorrect?"":" wrong")+'">'+(answer.isCorrect?"RICHTIG":"FALSCH")+'</span><span>'+(index+1)+". "+escapeHtml(answer.question.question)+'</span></summary><div class="review-content"><p><strong>Deine Antwort:</strong> '+escapeHtml(answer.selectedText)+'</p>'+(!answer.isCorrect?'<p><strong>Richtige Antwort:</strong> '+escapeHtml(answer.correctText)+'</p>':"")+'<p><strong>Begründung:</strong> '+escapeHtml(answer.explanation)+'</p></div></details>'
  ).join("");
  if(reportToLms)window.BuildBenchLMS?.recordQuizResult({score,maxScore:TEST_SIZE});
  $("#result-title").focus({preventScroll:true});$("#result-panel").scrollIntoView({behavior:reducedMotion?"auto":"smooth",block:"start"});
}
function startQuiz(focusQuestion=true,restore=true){
  const saved=restore?window.BuildBenchLMS?.getQuizSession():null;
  const savedIds=Array.isArray(saved?.ids)?saved.ids:[];
  const savedChoices=Array.isArray(saved?.choices)?saved.choices:[];
  const questionsById=new Map(questionBank.map(question=>[question.id,question]));
  const canRestore=savedIds.length===TEST_SIZE&&new Set(savedIds).size===TEST_SIZE&&savedIds.every(id=>questionsById.has(id));
  activeQuestions=(canRestore?savedIds.map(id=>questionsById.get(id)):shuffle(questionBank).slice(0,TEST_SIZE)).map(prepareQuestion);
  answers=[];
  if(canRestore){
    for(let index=0;index<Math.min(savedChoices.length,TEST_SIZE);index+=1){
      const restored=answerFromChoice(activeQuestions[index],savedChoices[index]);
      if(!restored)break;
      answers.push(restored);
    }
  }
  currentIndex=Math.min(answers.length,TEST_SIZE-1);
  $("#result-panel").hidden=true;$("#quiz-panel").hidden=false;
  if(answers.length===TEST_SIZE){
    const alreadyReported=window.BuildBenchLMS?.getState?.()?.location==="quiz.html#ergebnis";
    renderResults(!alreadyReported);
  }
  else{
    renderQuestion(focusQuestion);
    window.BuildBenchLMS?.recordQuizProgress({
      answered:answers.length,
      total:TEST_SIZE,
      score:answers.filter(answer=>answer.isCorrect).length,
      session:quizSession()
    });
  }
}
$("#answer-list").addEventListener("change",()=>{$("#submit-answer").disabled=false});
$("#quiz-form").addEventListener("submit",submitAnswer);
$("#next-question").addEventListener("click",()=>{if(currentIndex===TEST_SIZE-1){renderResults();return}currentIndex+=1;renderQuestion()});
$("#restart-quiz").addEventListener("click",()=>{
  window.BuildBenchLMS?.clearQuizSession();
  startQuiz(true,false);
});

function validateQuizData(data){
  if(!data||data.schemaVersion!==1||!Array.isArray(data.questions))throw new Error("Nicht unterstütztes JSON-Format.");
  if(!Number.isInteger(data.testSize)||data.testSize<1)throw new Error("Ungültige Testgröße.");
  if(data.questions.length<data.testSize)throw new Error("Der Fragenpool ist kleiner als die Testgröße.");
  const ids=new Set();
  for(const question of data.questions){
    if(!question||typeof question.id!=="string"||ids.has(question.id))throw new Error("Fehlende oder doppelte Fragen-ID.");
    ids.add(question.id);
    if(!question.category||!question.question||!question.hint)throw new Error("Unvollständige Frage "+question.id+".");
    if(!Array.isArray(question.options)||question.options.length!==4)throw new Error("Frage "+question.id+" benötigt vier Antworten.");
    const optionIds=new Set(question.options.map(option=>option.id));
    if(optionIds.size!==4||!["A","B","C","D"].every(id=>optionIds.has(id)))throw new Error("Antwort-IDs bei "+question.id+" sind ungültig.");
    if(!optionIds.has(question.correctAnswer))throw new Error("Richtige Antwort bei "+question.id+" fehlt.");
    if(question.options.some(option=>!option.text||!option.feedback))throw new Error("Antwort oder Feedback bei "+question.id+" ist leer.");
  }
}
function applyQuizMetadata(){
  const poolSize=questionBank.length;
  $("#pool-test-size").textContent=TEST_SIZE;
  $("#pool-size").textContent="aus "+poolSize+" Fragen";
  $("#hero-test-size").textContent=TEST_SIZE;
  $("#hero-pool-size").textContent=poolSize;
  $("#progress-track").setAttribute("aria-valuemax",String(TEST_SIZE));
  $("#result-total").textContent="von "+TEST_SIZE;
  $("#result-ring").setAttribute("aria-label","0 von "+TEST_SIZE+" Fragen richtig");
}
async function loadQuestionBank(){
  const response=await fetch("quiz-questions.json",{cache:"no-cache"});
  if(!response.ok)throw new Error("HTTP "+response.status);
  const data=await response.json();
  validateQuizData(data);
  questionBank=data.questions;
  TEST_SIZE=data.testSize;
  applyQuizMetadata();
  $("#quiz-panel").setAttribute("aria-busy","false");
  startQuiz(false);
}
function showLoadError(error){
  console.error("Quizdaten konnten nicht geladen werden:",error);
  $("#quiz-panel").setAttribute("aria-busy","false");
  $("#question-heading").textContent="Fragen konnten nicht geladen werden";
  $("#question-hint").hidden=true;
  $("#answer-list").innerHTML='<p class="quiz-load-error" role="alert">Die Datei quiz-questions.json fehlt oder enthält ungültige Daten. Starte die Anwendung über einen Webserver und prüfe die Datei mit dem Import-/Export-Skript.</p>';
  $("#submit-answer").hidden=true;
  $("#next-question").hidden=true;
}
loadQuestionBank().catch(showLoadError);
