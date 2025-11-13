function renderCard(pokemonSummary) {
  return `
                <div class="card__header">
                        <span class="card__id">#${pokemonSummary.id}</span>
                                        <h3 class="card__name">${pokemonSummary.name}</h3>
                                </div>
                                <div class="card__media"><img src="${pokemonSummary.image}" alt="${pokemonSummary.name}"></div>
                <div class="card__body">
                        <div class="type-badges" data-id="${pokemonSummary.id}"></div>
                </div>`;
}

function renderModal() {
  return `
        <div class="modal-card" role="dialog" aria-modal="true" aria-labelledby="modalTitle">
            <button class="modal-close" aria-label="Close">×</button>
            <div class="card-top">
                <div class="top-inner">
                    <div class="title-wrap">
                        <h2 id="modalTitle">Name</h2>
                    </div>
                    <div class="id-wrap">#000</div>
                    <div class="modal-type-badges"></div>
                    <div class="detail-image-wrap"><img class="detail-image" src="" alt=""></div>
                </div>
            </div>
            <div class="card-bottom">
                <div class="card-body">
                    <div class="detail-content">
                        <div class="detail-tabs" role="tablist">
                            <button role="tab" data-tab="overview" aria-selected="true">About</button>
                            <button role="tab" data-tab="stats">Stats</button>
                        </div>
                        <div class="detail-panels">
                            <section data-panel="overview" role="tabpanel">Loading...</section>
                            <section data-panel="stats" role="tabpanel" hidden></section>
                        </div>
                    </div>
                </div>
                <div class="modal-nav" aria-hidden="true">
                    <button class="nav-btn nav-prev" aria-label="Previous">‹</button>
                    <button class="nav-btn nav-next" aria-label="Next">›</button>
                </div>
            </div>
        </div>`;
}

function renderOverview(overview) {
  return `
                <div class="about-grid">
                        <div><strong>Species</strong></div><div>${overview.speciesName}</div>
                        <div><strong>Height</strong></div><div>${overview.height}</div>
                        <div><strong>Weight</strong></div><div>${overview.weight}</div>
                        <div><strong>Abilities</strong></div><div>${overview.abilities}</div>
                </div>`;
}

function renderStats(statsHtml) {
  return `${statsHtml}`;
}

window.templates = { renderCard, renderModal, renderOverview, renderStats };
