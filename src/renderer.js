document.addEventListener("DOMContentLoaded", async () => {
  const urlInput = document.getElementById("url-input")
  const launchBtn = document.getElementById("launch-btn")
  const recentUrlsContainer = document.getElementById("recent-urls")
  const status = document.getElementById("status")

  // Load recent URLs on startup
  loadRecentUrls()

  // Handle launch button click
  launchBtn.addEventListener("click", async () => {
    const url = urlInput.value.trim()
    if (!url) {
      showStatus("Please enter a URL", "error")
      return
    }

    launchBtn.disabled = true
    launchBtn.textContent = "Launching..."

    try {
      const result = await window.electronAPI.launchKiosk(url)

      if (result.success) {
        showStatus("Launched successfully!", "success")
        await window.electronAPI.saveRecentUrl(url)
        loadRecentUrls()
        urlInput.value = ""
      } else {
        showStatus(`Error: ${result.error}`, "error")
      }
    } catch (error) {
      showStatus("Failed to launch kiosk mode", "error")
    }

    launchBtn.disabled = false
    launchBtn.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
        <line x1="8" y1="21" x2="16" y2="21"/>
        <line x1="12" y1="17" x2="12" y2="21"/>
      </svg>
      Launch in Kiosk Mode
    `
  })

  // Handle Enter key
  urlInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      launchBtn.click()
    }
  })

  // Load recent URLs
  async function loadRecentUrls() {
    try {
      const recentUrls = await window.electronAPI.getRecentUrls()
      recentUrlsContainer.innerHTML = ""

      recentUrls.forEach((url) => {
        const item = document.createElement("div")
        item.className = "recent-item"
        item.textContent = url
        item.addEventListener("click", () => {
          urlInput.value = url
          urlInput.focus()
        })
        recentUrlsContainer.appendChild(item)
      })
    } catch (error) {
      console.error("Failed to load recent URLs:", error)
    }
  }

  // Show status messages
  function showStatus(message, type) {
    status.textContent = message
    status.className = `status ${type}`
    status.classList.remove("hidden")

    setTimeout(() => {
      status.classList.add("hidden")
    }, 3000)
  }
})