(function () {
  const BASE_URL = 'https://movie-list.alphacamp.io'
  const INDEX_URL = BASE_URL + '/api/v1/movies/'
  const POSTER_URL = BASE_URL + '/posters/'
  const data = [] //用來放置所有電影資料
  const dataPanel = document.getElementById('data-panel')
  //串接所有電影資料的API，並動態渲染所有資料
  axios.get(INDEX_URL).then((response) => {
    data.push(...response.data.results)
    //呼叫動態渲染所有資料的function
    // displayDataList(data)
    //取出特定頁面的資料，(1,data)表示一開始讀取網址時就要顯示分頁的第一頁
    getPageData(1, data)
    //顯示所有分頁按鈕
    getTotalPages(data)
  }).catch((err) => console.log(err))

  // 在dataPanel上設置click監聽事件，監聽'More'及'+'按鈕
  dataPanel.addEventListener('click', (event) => {
    if (event.target.matches('.btn-show-movie')) {
      showMovie(event.target.dataset.id)
    } else if (event.target.matches('.btn-add-favorite')) {
      addFavoriteItem(event.target.dataset.id)
    }
  })
  //動態渲染資料的function
  function displayDataList(data, patternType) {
    let htmlContent = ""
    if (patternType === "card" || typeof (patternType) === "undefined") {
      data.forEach(item => {
        htmlContent += `
        <div class="col-sm-3">
          <div class="card mb-2">
            <img class="card-img-top " src="${POSTER_URL}${item.image}" alt="Card image cap">
            <div class="card-body movie-item-body">
              <h5 class="card-title">${item.title}</h5>
            </div>
            <!-- "More" button -->
            <div class="card-footer">
              <button class="btn btn-primary btn-show-movie" data-toggle="modal" data-target="#show-movie-modal" data-id="${item.id}">More</button> 
              <!-- favorite button -->
              <button class="btn btn-info btn-add-favorite" data-id="${item.id}">+</button> 
            </div>
          </div>     
        </div>
      `
      })
    }
    else if (patternType === "list") {
      data.forEach(item => {
        htmlContent += `
          <table class="table table-hover">
            <thead></thead>
            <tbody>
              <tr>
                <td>${item.title}</td>
                <td class="text-right">            
                  <!-- "More" button -->
                  <button class="btn btn-primary btn-show-movie" data-toggle="modal" data-target="#show-movie-modal" data-id="${item.id}">More</button>
                  <!-- favorite button --> 
                  <button class="btn btn-info btn-add-favorite" data-id="${item.id}">+</button>
                </td>
              </tr>
            </tbody>
          </table>
        `;
      });
    }


    dataPanel.innerHTML = htmlContent
  }
  //要做的事情是:串接show API 以及操作DOM元素 把資料塞進 Modal Ui
  function showMovie(id) {
    //選出Modal中個元素節點
    const modalTitle = document.getElementById('show-movie-title')
    const modalImage = document.getElementById('show-movie-image')
    const modalDate = document.getElementById('show-movie-date')
    const modalDescription = document.getElementById('show-movie-description')
    //定義 show API 的網址
    const url = INDEX_URL + id
    console.log(url)
    // 串接API
    axios.get(url).then(response => {
      const data = response.data.results
      //把收到的該筆資料中的各項內容塞進modal裡面
      modalTitle.textContent = data.title
      modalImage.innerHTML = `<img src="${POSTER_URL}${data.image}" class="img-fluid" alt="Responsive image">`
      modalDate.textContent = `release at : ${data.release_date}`
      modalDescription.textContent = `${data.description}`
    })
  }
  //監聽search按鈕點擊事件，執行篩選電影的動作
  const searchForm = document.getElementById('search')
  const searchInput = document.getElementById('search-input')
  searchForm.addEventListener('submit', event => {
    event.preventDefault() //預防畫面跳轉
    let input = searchInput.value.toLowerCase() //抓出使用者key in的關鍵字
    let results = data.filter(
      movie => movie.title.toLowerCase().includes(input)
    )//進行比對，只要movie.title.toLowerCase().includes(input) 回傳是true，就會回傳符合條件的電影
    // displayDataList(results) //將原本的內容抽換成搜尋結果
    getTotalPages(results)
    getPageData(1, results)
  })
  //將使用者想收藏的電影送進 local storage 儲存起來
  function addFavoriteItem(id) {
    //list 原本是一個空陣列，內容物是把localStorage中的value從string轉變成object
    const list = JSON.parse(localStorage.getItem('favoriteMovies')) || []
    //預計收藏的某一筆電影，透過點擊+事件，找到該筆電影id
    const movie = data.find(item => item.id === Number(id))
    // 用來判斷是否清單中已有相同的電影
    if (list.some(item => item.id === Number(id))) {
      alert(`${movie.title} is already in your favorite list.`)
    } else {
      list.push(movie)
      alert(`Added ${movie.title} to your favorite list!`)
    }
    //送進localStorage 儲存起來，要把data改成string
    localStorage.setItem('favoriteMovies', JSON.stringify(list))
  }
  //計算總頁數並演算 li.page-item
  const pagination = document.getElementById('pagination')
  const ITEM_PER_PAGE = 12
  function getTotalPages(data) {
    let totalPages = Math.ceil(data.length / ITEM_PER_PAGE) || 1
    let pageItemContent = ''
    for (let i = 0; i < totalPages; i++) {
      pageItemContent += `
        <li class="page-item">
          <a class="page-link" href="javascript:;" data-page="${i + 1}">${i + 1}</a>
        </li>
      `
    }
    pagination.innerHTML = pageItemContent
  }
  // 新增 Pagination 標籤的事件監聽器，情境有兩種。
  pagination.addEventListener('click', event => {
    if (event.target.tagName === 'A') {
      //點擊某分頁，透過客製化的data-page標籤找到該頁碼並傳入 getPageData function
      getPageData(event.target.dataset.page)
    }
  })
  // 運算出需要取出的資料，然後將取出的資料傳給 displayDataList()，渲染到頁面上。
  let paginationData = []
  function getPageData(pageNum, data) {
    paginationData = data || paginationData
    let offset = (pageNum - 1) * ITEM_PER_PAGE
    let pageData = paginationData.slice(offset, offset + ITEM_PER_PAGE)
    displayDataList(pageData)
  }
  //在viewChange上面掛載監聽器
  let patternType = ""
  const viewChange = document.querySelector('.view-change')
  viewChange.addEventListener('click', (event) => {
    if (event.target.matches(".fa-bars")) {
      patternType = "list"
    } else if (event.target.matches("fa-th")) {
      patternType = "card"
    }
    displayDataList(pageData, patternType)
  })

})()