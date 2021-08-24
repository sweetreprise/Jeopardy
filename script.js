// categories is the main data structure for the app; it looks like this:

//  [
//    { title: "Math",
//      clues: [
//        {question: "2+2", answer: 4, showing: null},
//        {question: "1+1", answer: 2, showing: null}
//        ...
//      ],
//    },
//    { title: "Literature",
//      clues: [
//        {question: "Hamlet Author", answer: "Shakespeare", showing: null},
//        {question: "Bell Jar Author", answer: "Plath", showing: null},
//        ...
//      ],
//    },
//    ...
//  ]

const NUM_CATEGORIES = 6;
const NUM_CLUES = 5;
let categories = [];
let board = $('#gameboard');
let btn = $('#restart-button');

/** Get NUM_CATEGORIES random category from API.
 *
 * Returns array of category ids
 */
async function getCategoryIds() {
    //requests category data with random offset variable
    //used 7150 as the offset variable, as it seemed to encompass all available categories
    const response  = await axios.get('https://jservice.io/api/categories', { params: { count: 100, offset: Math.floor(Math.random() * 7150) } });

    //takes response data, takes a sample size of 6 and returns a random array
    let randomArray = _.sampleSize(response.data, NUM_CATEGORIES);

    //maps through the randomArray and gets the category ids
    await getCategory(randomArray.map(category => category.id));
}

/** Return object with data about a category:
 *
 *  Returns { title: "Math", clues: clue-array }
 *
 * Where clue-array is:
 *   [
 *      {question: "Hamlet Author", answer: "Shakespeare", showing: null},
 *      {question: "Bell Jar Author", answer: "Plath", showing: null},
 *      ...
 *   ]
 */

async function getCategory(categoryIdArray) {
    for(let id of categoryIdArray) {
        //loops through categoryIdArray and plugs each id into API request
        const response = await axios.get('https://jservice.io/api/category', { params: { id: id }});
        //takes a chunk of NUM_CLUES from the available clues
        //used the _.chunk method as the response.data.clues returns an array of 10 clues with repeated clues after the first 5 clues. using the ._sampleSize method to randomize clues sometimes returned identical clues.
        let randomClues = _.chunk(response.data.clues, NUM_CLUES)[0];
        //maps through randomClues array and returns only the question, answer and showing
        let clues = randomClues.map(clue => ({
            question: clue.question,
            answer: clue.answer,
            showing: null
        }));
        //pushes category info into the global categories array
        categories.push({
            title: response.data.title,
            clues: clues
        });
    }
    return categories;
}

/** Fill the HTML table#jeopardy with the categories & cells for questions.
 *
 * - The <thead> should be filled w/a <tr>, and a <td> for each category
 * - The <tbody> should be filled w/NUM_QUESTIONS_PER_CAT <tr>s,
 *   each with a question for each category in a <td>
 *   (initally, just show a "?" where the question/answer would go.)
 */

function fillTable() {
    //creates thead and appends topRow to thead
    const tableHead = document.createElement('thead');
    const topRow = document.createElement('tr');
    tableHead.append(topRow);
    //loops through NUM_CATEGORIES times and creates td elements with each category title, then appends to topRow
    for(let i = 0; i < NUM_CATEGORIES; i++) {
        const category = document.createElement('td');
        category.innerText = `${categories[i].title}`;
        topRow.append(category);
    }
    board.append(tableHead);

    const tableBody = document.createElement('tbody');
    //loops through NUM_CLUES and creates a row each time. sets id and appends row to tbody
    for(let i = 0; i < NUM_CLUES; i++) {
        const row = document.createElement('tr');
        row.id = `${i}`;
        tableBody.append(row);
        //loops through NUM_CATEGORIES and creates a td for as many categories
        //sets data-category property and innerText of each td
        //appends each td to its row
        for(let j = 0; j < NUM_CATEGORIES; j++) {
            const question = document.createElement('td');
            question.setAttribute('data-category', `${j}`)
            question.innerText = '?'
            row.append(question);
        }
        board.append(tableBody);
    }
}

/** Handle clicking on a clue: show the question or answer.
 *
 * Uses .showing property on clue to determine wham                                                                 t to show:
 * - if currently null, show question & set .showing to "question"
 * - if currently "question", show answer & set .showing to "answer"
 * - if currently "answer", ignore click
 * */

function handleClick(e) {
    let clicked = e.target;
    //sets clueId to the row id of the clicked td
    let clueId = clicked.parentElement.id;
    //sets categoryId to the data-category of the clicked td
    let categoryId = clicked.dataset.category;
    //sets clue to the appropriate category of the clicked td and resulting clue at index of clueId
    let clue = categories[categoryId].clues[clueId];

    //logic to display appropriate info depending on .showing property
    if(clue.showing === null){
        clicked.innerText = categories[categoryId].clues[clueId].question;
        clue.showing = 'question';
    } else if(clue.showing === 'question') {
        clicked.innerText = categories[categoryId].clues[clueId].answer;
        clicked.classList = 'answered';
        clue.showing = 'answer';
    } else if(clue.showing === 'answer') {
        return;
    }
}

/** Wipe the current Jeopardy board, show the loading spinner,
 * and update the button used to fetch data.
 */

function showLoadingView() {
    $('#loading-spinner').css('display', 'inline-block');
    btn[0].innerText = 'LOADING...';
}

/** Remove the loading spinner and update the button used to fetch data. */

function hideLoadingView() {
    $('#loading-spinner').css('display', 'none');
    btn[0].innerText = 'RESTART';
}

/** Start game:
 *
 * - get random category Ids
 * - get data for each category
 * - create HTML table
 * */

function setupAndStart() {
    //empties game board and categories array
    board.empty();
    categories = [];
    //shows loading view
    showLoadingView();
    //executes fillTable() and hideLoadingView() functions after promise is resolved
    getCategoryIds().then(
        () => {
            fillTable();
            hideLoadingView();
        })
        .catch(() => {
            alert('OOPS, The request failed. Please try again.');
        });
}

/** On click of start / restart button, set up game. */

btn.on('click', () => setupAndStart());

/** On page load, add event handler for clicking clues */

board.on('click', 'tbody', (e) => handleClick(e));