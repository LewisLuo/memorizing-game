const GAME_STATE = {
  FirstCardAwaits: "FirstCardAwaits",
  SecondCardAwaits: "SecondCardAwaits",
  CardsMatchFailed: "CardsMatchFailed",
  CardsMatched: "CardsMatched",
  GameFinished: "GameFinished",
}

const Symbols = [
  'https://image.flaticon.com/icons/svg/105/105223.svg', // 黑桃
  'https://image.flaticon.com/icons/svg/105/105220.svg', // 愛心
  'https://image.flaticon.com/icons/svg/105/105212.svg', // 方塊
  'https://image.flaticon.com/icons/svg/105/105219.svg' // 梅花
]

const view = {
  getCardElement(index) { //index = 0-51
    return `
      <div data-index="${index}" class="card back">
      </div>`
  },
  getCardContent(index) {
    const number = this.transformNumber((index % 13) + 1) //index 0-12 switch to number 1-13
    const symbol = Symbols[Math.floor(index / 13)]  // 0-12 for 黑桃 ; 13-25 for 愛心 ; 26-38 for 方塊 ; 39-51 for 梅花
    return `
      <p>${number}</p>
      <img src="${symbol}" alt="">
      <p>${number}</p>`
  },
  transformNumber(number) {
    switch (number) {
      case 1:
        return 'A'
      case 11:
        return 'J'
      case 12:
        return 'Q'
      case 13:
        return 'K'
      default:
        return number
    }
  },
  displayCards(indexes) { //參數為經getRandomNumberArray()打亂過的隨機Array
    const rootElement = document.querySelector('#cards')
    rootElement.innerHTML = ''
    rootElement.innerHTML = indexes.map(index => this.getCardElement(index)).join('')
  },
  flipCards(...cards) {
    cards.map(card => {
      if (card.classList.contains('back')) {
        //如果牌面是背面=>回傳正面
        card.classList.remove('back')
        card.innerHTML = this.getCardContent(Number(card.dataset.index))
        return
      }
      //如果牌面是正面=>回傳背面
      card.classList.add('back')
      card.innerHTML = ''
    })
  },
  pairCards(...cards) {
    cards.map(card => card.classList.add('paired'))
  },
  renderScore(score) {
    document.querySelector('#score').innerText = `Score: ${score}`
  },
  renderBestAttempt(score) {
    document.querySelector('#bestAttempt').innerText = `Best Attempt: ${score} times`
  },
  renderTriedTimes(times) {
    document.querySelector('#attempt').innerText = `You've tried: ${times} times`
  },
  appendWrongAnimation(...cards) {
    cards.map(card => {
      card.classList.add('wrong')
      card.addEventListener('animationend', event => event.target.classList.remove('wrong'), { once: true })
    })
  },
  showGameFinished() {
    const div = document.createElement('div')
    div.classList.add('completed')
    div.innerHTML = `
      <p>You Win!</p>
      <p>You've tried: ${model.triedTimes} times</p>
      <p>Your best attempt is: ${model.bestAttempt} times</p></br>
      <p style="font-weight:bold">Can you do bettter?</p>
      <div id="try-again-btn">Try Again!</div>
    `
    const header = document.querySelector('#header')
    header.before(div)

    const tryAgainButton = document.querySelector('#try-again-btn')
    tryAgainButton.addEventListener('click', (event) => {
      div.remove()
      controller.resetGame()
    }, { once: true })
  },
}

const controller = {
  currentState: GAME_STATE.FirstCardAwaits,

  generateCards() {
    view.displayCards(utility.getRandomNumberArray(52))
    document.querySelectorAll('.card').forEach(card => {
      card.addEventListener('click', event => {
        controller.dispatchCardAction(card)
      })
    })
  },
  dispatchCardAction(card) {
    if (!card.classList.contains('back')) {
      return
    }

    switch (this.currentState) {
      case GAME_STATE.FirstCardAwaits:
        view.flipCards(card)
        model.revealedCards.push(card)
        this.currentState = GAME_STATE.SecondCardAwaits
        break
      case GAME_STATE.SecondCardAwaits:
        view.renderTriedTimes(++model.triedTimes)

        view.flipCards(card)
        model.revealedCards.push(card)

        //判斷是否配對成功
        if (model.isRevealedCardsMatched()) {
          //配對正確
          this.currentState = GAME_STATE.CardsMatched
          view.renderScore(model.score += 10)
          view.pairCards(...model.revealedCards)
          model.revealedCards = []

          if (model.score === 260) {
            console.log('showGameFinished')
            this.currentState = GAME_STATE.GameFinished
            if ((model.bestAttempt === 0) || (model.bestAttempt > model.triedTimes)) {
              model.bestAttempt = model.triedTimes
              view.renderBestAttempt(model.bestAttempt)
            }
            view.showGameFinished()
            return
          }

          this.currentState = GAME_STATE.FirstCardAwaits
        } else {
          //配對失敗
          this.currentState = GAME_STATE.CardsMatchFailed
          view.appendWrongAnimation(...model.revealedCards)
          setTimeout(this.resetCards, 1000)
        }
    }
  },
  resetCards() {
    view.flipCards(...model.revealedCards)
    model.revealedCards = []
    controller.currentState = GAME_STATE.FirstCardAwaits
  },
  resetGame() {
    view.renderScore(model.score = 0)
    view.renderTriedTimes(model.triedTimes = 0)
    controller.currentState = GAME_STATE.FirstCardAwaits

    controller.generateCards()
  }
}

const model = {
  revealedCards: [],

  isRevealedCardsMatched() {
    return this.revealedCards[0].dataset.index % 13 === this.revealedCards[1].dataset.index % 13
  },

  score: 0,
  triedTimes: 0,
  bestAttempt: 0,
}

const utility = {
  getRandomNumberArray(count) {
    const number = Array.from(Array(count).keys())
    for (let index = number.length - 1; index > 0; index--) {
      let randomIndex = Math.floor(Math.random() * (index + 1))
        ;[number[index], number[randomIndex]] = [number[randomIndex], number[index]]
    }
    return number
  }
}

controller.generateCards()

document.querySelector('#reset-btn').addEventListener('click', controller.resetGame)