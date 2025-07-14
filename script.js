class RecipeSearchApp {
    constructor() {
        this.apiBaseUrl = 'https://www.themealdb.com/api/json/v1/1';
        this.searchInput = document.getElementById('searchInput');
        this.searchBtn = document.getElementById('searchBtn');
        this.loadingElement = document.getElementById('loading');
        this.errorMessage = document.getElementById('errorMessage');
        this.resultsContainer = document.getElementById('resultsContainer');
        this.recipeModal = document.getElementById('recipeModal');
        this.closeModal = document.getElementById('closeModal');
        this.recipeDetails = document.getElementById('recipeDetails');
        
        // お気に入り機能関連の要素
        this.searchNavBtn = document.getElementById('searchNavBtn');
        this.favoritesNavBtn = document.getElementById('favoritesNavBtn');
        this.searchSection = document.getElementById('searchSection');
        this.favoritesSection = document.getElementById('favoritesSection');
        this.favoritesContainer = document.getElementById('favoritesContainer');
        this.noFavorites = document.getElementById('noFavorites');
        
        // お気に入り管理用のプロパティ
        this.favorites = this.loadFavorites();
        this.currentRecipe = null;
        
        // カテゴリ関連のプロパティ
        this.categoriesContainer = document.getElementById('categoriesContainer');
        this.categories = [];
        this.selectedCategory = null;
        
        this.init();
    }

    init() {
        this.searchBtn.addEventListener('click', () => this.handleSearch());
        this.searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleSearch();
            }
        });
        
        this.closeModal.addEventListener('click', () => this.hideModal());
        this.recipeModal.addEventListener('click', (e) => {
            if (e.target === this.recipeModal) {
                this.hideModal();
            }
        });
        
        // ナビゲーション機能
        this.searchNavBtn.addEventListener('click', () => this.showSearchView());
        this.favoritesNavBtn.addEventListener('click', () => this.showFavoritesView());
        
        // 初期表示
        this.showSearchView();
        this.loadCategories();
    }

    async handleSearch() {
        const searchTerm = this.searchInput.value.trim();
        
        if (!searchTerm) {
            this.showError('検索キーワードを入力してください。');
            return;
        }

        this.showLoading();
        this.clearError();
        this.clearResults();

        try {
            const recipes = await this.searchRecipes(searchTerm);
            this.hideLoading();
            
            if (recipes && recipes.length > 0) {
                this.displayResults(recipes);
            } else {
                this.showError('レシピが見つかりませんでした。他のキーワードで検索してみてください。');
            }
        } catch (error) {
            this.hideLoading();
            this.showError('エラーが発生しました。時間をおいて再度お試しください。');
            console.error('検索エラー:', error);
        }
    }

    async searchRecipes(searchTerm) {
        try {
            // まず料理名で検索
            const nameSearchResponse = await fetch(`${this.apiBaseUrl}/search.php?s=${encodeURIComponent(searchTerm)}`);
            const nameSearchData = await nameSearchResponse.json();
            
            if (nameSearchData.meals && nameSearchData.meals.length > 0) {
                return nameSearchData.meals;
            }

            // 料理名で見つからない場合は食材で検索
            const ingredientSearchResponse = await fetch(`${this.apiBaseUrl}/filter.php?i=${encodeURIComponent(searchTerm)}`);
            const ingredientSearchData = await ingredientSearchResponse.json();
            
            if (ingredientSearchData.meals && ingredientSearchData.meals.length > 0) {
                return ingredientSearchData.meals;
            }

            return null;
        } catch (error) {
            throw new Error('API通信に失敗しました: ' + error.message);
        }
    }

    displayResults(recipes) {
        this.resultsContainer.innerHTML = '';
        
        recipes.forEach(recipe => {
            const recipeCard = this.createRecipeCard(recipe);
            this.resultsContainer.appendChild(recipeCard);
        });
    }

    createRecipeCard(recipe) {
        const card = document.createElement('div');
        card.className = 'recipe-card';
        card.onclick = (e) => {
            if (!e.target.classList.contains('favorite-heart')) {
                this.showRecipeDetails(recipe.idMeal);
            }
        };
        
        const isFavorited = this.isFavorited(recipe.idMeal);
        
        card.innerHTML = `
            <img src="${recipe.strMealThumb}" alt="${recipe.strMeal}">
            <button class="favorite-heart ${isFavorited ? 'favorited' : 'not-favorited'}" 
                    onclick="event.stopPropagation(); window.recipeApp.toggleFavorite('${recipe.idMeal}', this)">
                <i class="fas fa-heart"></i>
            </button>
            <div class="recipe-card-content">
                <h3>${recipe.strMeal}</h3>
                <span class="category">${recipe.strCategory || 'カテゴリ不明'}</span>
            </div>
        `;
        
        return card;
    }

    async showRecipeDetails(mealId) {
        this.showLoading();
        
        try {
            const response = await fetch(`${this.apiBaseUrl}/lookup.php?i=${mealId}`);
            const data = await response.json();
            
            if (data.meals && data.meals.length > 0) {
                const recipe = data.meals[0];
                this.renderRecipeDetails(recipe);
                this.showModal();
            } else {
                this.showError('レシピの詳細を取得できませんでした。');
            }
        } catch (error) {
            this.showError('レシピの詳細を取得中にエラーが発生しました。');
            console.error('レシピ詳細取得エラー:', error);
        } finally {
            this.hideLoading();
        }
    }

    renderRecipeDetails(recipe) {
        const ingredients = this.getIngredients(recipe);
        const instructions = recipe.strInstructions || 'レシピの手順が見つかりません。';
        const isFavorited = this.isFavorited(recipe.idMeal);
        
        this.currentRecipe = recipe;
        
        this.recipeDetails.innerHTML = `
            <div class="recipe-details">
                <img src="${recipe.strMealThumb}" alt="${recipe.strMeal}">
                <h2>${recipe.strMeal}</h2>
                
                <button class="favorite-btn ${isFavorited ? 'favorited' : 'not-favorited'}" 
                        onclick="window.recipeApp.toggleFavoriteFromModal()">
                    <i class="fas fa-heart"></i>
                    ${isFavorited ? 'お気に入りから削除' : 'お気に入りに追加'}
                </button>
                
                <div class="recipe-info">
                    <div class="ingredients">
                        <h3>材料</h3>
                        <ul>
                            ${ingredients.map(ingredient => `<li>${ingredient}</li>`).join('')}
                        </ul>
                    </div>
                    
                    <div class="instructions">
                        <h3>作り方</h3>
                        <ol>
                            ${instructions.split('\n').filter(step => step.trim()).map(step => `<li>${step.trim()}</li>`).join('')}
                        </ol>
                    </div>
                </div>
                
                ${recipe.strYoutube ? `
                    <div class="video-link" style="text-align: center; margin-top: 20px;">
                        <a href="${recipe.strYoutube}" target="_blank" style="display: inline-block; padding: 10px 20px; background-color: #e74c3c; color: white; text-decoration: none; border-radius: 5px;">
                            <i class="fab fa-youtube"></i> YouTubeで動画を見る
                        </a>
                    </div>
                ` : ''}
            </div>
        `;
    }

    getIngredients(recipe) {
        const ingredients = [];
        
        for (let i = 1; i <= 20; i++) {
            const ingredient = recipe[`strIngredient${i}`];
            const measure = recipe[`strMeasure${i}`];
            
            if (ingredient && ingredient.trim()) {
                ingredients.push(`${measure ? measure.trim() + ' ' : ''}${ingredient.trim()}`);
            }
        }
        
        return ingredients;
    }

    showLoading() {
        this.loadingElement.style.display = 'flex';
    }

    hideLoading() {
        this.loadingElement.style.display = 'none';
    }

    showError(message) {
        this.errorMessage.textContent = message;
        this.errorMessage.style.display = 'block';
    }

    clearError() {
        this.errorMessage.style.display = 'none';
        this.errorMessage.textContent = '';
    }

    clearResults() {
        this.resultsContainer.innerHTML = '';
    }

    showModal() {
        this.recipeModal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }

    hideModal() {
        this.recipeModal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }

    // お気に入り機能
    loadFavorites() {
        const favorites = localStorage.getItem('cookery-favorites');
        return favorites ? JSON.parse(favorites) : {};
    }

    saveFavorites() {
        localStorage.setItem('cookery-favorites', JSON.stringify(this.favorites));
    }

    isFavorited(mealId) {
        return this.favorites.hasOwnProperty(mealId);
    }

    toggleFavorite(mealId, buttonElement) {
        if (this.isFavorited(mealId)) {
            this.removeFavorite(mealId);
            buttonElement.classList.remove('favorited');
            buttonElement.classList.add('not-favorited');
        } else {
            this.addFavorite(mealId);
            buttonElement.classList.remove('not-favorited');
            buttonElement.classList.add('favorited');
        }
        this.updateFavoritesDisplay();
    }

    toggleFavoriteFromModal() {
        if (!this.currentRecipe) return;
        
        const mealId = this.currentRecipe.idMeal;
        const favoriteBtn = document.querySelector('.favorite-btn');
        
        if (this.isFavorited(mealId)) {
            this.removeFavorite(mealId);
            favoriteBtn.innerHTML = '<i class="fas fa-heart"></i> お気に入りに追加';
            favoriteBtn.classList.remove('favorited');
            favoriteBtn.classList.add('not-favorited');
        } else {
            this.addFavorite(mealId);
            favoriteBtn.innerHTML = '<i class="fas fa-heart"></i> お気に入りから削除';
            favoriteBtn.classList.remove('not-favorited');
            favoriteBtn.classList.add('favorited');
        }
        
        this.updateFavoritesDisplay();
        this.updateHeartButtons();
    }

    addFavorite(mealId) {
        this.favorites[mealId] = {
            idMeal: this.currentRecipe.idMeal,
            strMeal: this.currentRecipe.strMeal,
            strMealThumb: this.currentRecipe.strMealThumb,
            strCategory: this.currentRecipe.strCategory,
            addedAt: new Date().toISOString()
        };
        this.saveFavorites();
    }

    removeFavorite(mealId) {
        delete this.favorites[mealId];
        this.saveFavorites();
    }

    updateHeartButtons() {
        const heartButtons = document.querySelectorAll('.favorite-heart');
        heartButtons.forEach(button => {
            const mealId = button.getAttribute('onclick').match(/'([^']+)'/)[1];
            if (this.isFavorited(mealId)) {
                button.classList.remove('not-favorited');
                button.classList.add('favorited');
            } else {
                button.classList.remove('favorited');
                button.classList.add('not-favorited');
            }
        });
    }

    // ナビゲーション機能
    showSearchView() {
        this.searchSection.style.display = 'block';
        this.favoritesSection.style.display = 'none';
        this.searchNavBtn.classList.add('active');
        this.favoritesNavBtn.classList.remove('active');
    }

    showFavoritesView() {
        this.searchSection.style.display = 'none';
        this.favoritesSection.style.display = 'block';
        this.searchNavBtn.classList.remove('active');
        this.favoritesNavBtn.classList.add('active');
        this.displayFavorites();
    }

    displayFavorites() {
        const favoritesList = Object.values(this.favorites);
        
        if (favoritesList.length === 0) {
            this.favoritesContainer.innerHTML = '';
            this.noFavorites.style.display = 'block';
            return;
        }
        
        this.noFavorites.style.display = 'none';
        this.favoritesContainer.innerHTML = '';
        
        favoritesList.forEach(recipe => {
            const recipeCard = this.createFavoriteCard(recipe);
            this.favoritesContainer.appendChild(recipeCard);
        });
    }

    createFavoriteCard(recipe) {
        const card = document.createElement('div');
        card.className = 'recipe-card';
        card.onclick = (e) => {
            if (!e.target.classList.contains('favorite-heart')) {
                this.showRecipeDetails(recipe.idMeal);
            }
        };
        
        card.innerHTML = `
            <img src="${recipe.strMealThumb}" alt="${recipe.strMeal}">
            <button class="favorite-heart favorited" 
                    onclick="event.stopPropagation(); window.recipeApp.removeFavoriteFromCard('${recipe.idMeal}', this.parentElement)">
                <i class="fas fa-heart"></i>
            </button>
            <div class="recipe-card-content">
                <h3>${recipe.strMeal}</h3>
                <span class="category">${recipe.strCategory || 'カテゴリ不明'}</span>
            </div>
        `;
        
        return card;
    }

    removeFavoriteFromCard(mealId, cardElement) {
        this.removeFavorite(mealId);
        cardElement.remove();
        this.updateFavoritesDisplay();
    }

    updateFavoritesDisplay() {
        if (this.favoritesSection.style.display === 'block') {
            this.displayFavorites();
        }
    }

    // カテゴリ機能
    async loadCategories() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/categories.php`);
            const data = await response.json();
            
            if (data.categories) {
                this.categories = data.categories;
                this.renderCategories();
            }
        } catch (error) {
            console.error('カテゴリ取得エラー:', error);
        }
    }

    renderCategories() {
        this.categoriesContainer.innerHTML = '';
        
        // 「すべて」ボタンを追加
        const allButton = document.createElement('button');
        allButton.className = 'category-btn active';
        allButton.innerHTML = '<i class="fas fa-th-large"></i> すべて';
        allButton.onclick = () => this.selectCategory(null, allButton);
        this.categoriesContainer.appendChild(allButton);
        
        // カテゴリボタンを動的に生成
        this.categories.forEach(category => {
            const button = document.createElement('button');
            button.className = 'category-btn';
            button.innerHTML = `
                <img src="${category.strCategoryThumb}" alt="${category.strCategory}">
                ${category.strCategory}
            `;
            button.onclick = () => this.selectCategory(category.strCategory, button);
            this.categoriesContainer.appendChild(button);
        });
    }

    selectCategory(categoryName, buttonElement) {
        // 全てのボタンからactiveクラスを削除
        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // 選択されたボタンにactiveクラスを追加
        buttonElement.classList.add('active');
        
        this.selectedCategory = categoryName;
        
        // カテゴリが選択された場合は検索を実行
        if (categoryName) {
            this.searchByCategory(categoryName);
        } else {
            // 「すべて」が選択された場合は結果をクリア
            this.clearResults();
        }
    }

    async searchByCategory(categoryName) {
        this.showLoading();
        this.clearError();
        this.clearResults();
        
        try {
            const response = await fetch(`${this.apiBaseUrl}/filter.php?c=${encodeURIComponent(categoryName)}`);
            const data = await response.json();
            
            this.hideLoading();
            
            if (data.meals && data.meals.length > 0) {
                // カテゴリ検索結果にはカテゴリ情報が含まれていないため、手動で追加
                const mealsWithCategory = data.meals.map(meal => ({
                    ...meal,
                    strCategory: categoryName
                }));
                this.displayResults(mealsWithCategory);
            } else {
                this.showError('このカテゴリにはレシピが見つかりませんでした。');
            }
        } catch (error) {
            this.hideLoading();
            this.showError('カテゴリ検索中にエラーが発生しました。');
            console.error('カテゴリ検索エラー:', error);
        }
    }
}

// アプリケーションを初期化
document.addEventListener('DOMContentLoaded', () => {
    window.recipeApp = new RecipeSearchApp();
});