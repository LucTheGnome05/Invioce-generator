document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("invoice-form");
  
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
  
      const formData = new FormData(form);
      const data = {
        senderName: formData.get("senderName"),
        senderAddress: formData.get("senderAddress"),
        senderEmail: formData.get("senderEmail"),
        senderPhone: formData.get("senderPhone"),
        senderVAT: formData.get("senderVAT"),
        clientName: formData.get("clientName"),
        clientAddress: formData.get("clientAddress"),
        clientVAT: formData.get("clientVAT"),
        taxRate: formData.get("taxRate"),
        dueDate: formData.get("dueDate"),
        items: []
      };

      // Získání položek faktury
      const itemDescriptions = formData.getAll("description[]");
      const itemQuantities = formData.getAll("qty[]");
      const itemUnitPrices = formData.getAll("unitPrice[]");

      for (let i = 0; i < itemDescriptions.length; i++) {
        data.items.push({
            description: itemDescriptions[i],
            qty: parseFloat(itemQuantities[i]),
            unitPrice: parseFloat(itemUnitPrices[i])
          });
      }

      try {
        const res = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data)
        });
  
        if (!res.ok) throw new Error("Failed to generate invoice");
  
        const response = await res.json();
        const responseDiv = document.getElementById("response");
        responseDiv.innerHTML = "";
  
        const message = document.createElement("p");
        message.textContent = response.message;
        responseDiv.appendChild(message);
  
        const downloadLink = document.createElement("a");
        downloadLink.href = response.filePath;
        downloadLink.innerText = "Download Invoice";
        downloadLink.download = "invoice.pdf";
        downloadLink.style.display = "inline-block";
        downloadLink.style.marginTop = "10px";
        responseDiv.appendChild(downloadLink);
      } catch (err) {
        console.error("Chyba při generování faktury:", err);
        document.getElementById("response").textContent = "Něco se pokazilo.";
      }
    });

    // Dynamické přidávání položek
    document.getElementById("add-item").addEventListener("click", () => {
      const itemsContainer = document.getElementById("items-container");
      const newItem = document.createElement("div");
      newItem.classList.add("item");
      newItem.innerHTML = `
        <input type="text" placeholder="Description" name="description[]" required />
        <input type="number" placeholder="Quantity" name="qty[]" required />
        <input type="number" placeholder="Unit Price" name="unitPrice[]" required />
      `;
      itemsContainer.appendChild(newItem);
    });
});
