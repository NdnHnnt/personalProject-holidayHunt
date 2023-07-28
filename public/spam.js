document.addEventListener("DOMContentLoaded", () => {
  $("#search-button").on("click", function () {
    fetchHolidays();
  });

  var options = {
    allow_empty: true,
    filters: [
      {
        id: "name",
        labels: "name",
        type: "string",
        default_value: " ",
        size: 40,
        unique: true,
      },
      {
        id: "description",
        labels: "description",
        type: "string",
        default_value: " ",
        size: 100,
        unique: true,
      },
      {
        id: "date",
        labels: "date",
        type: "date",
        validation: {
          format: "YYYY-MM-DD",
        },
        plugin: "datepicker",
        plugin_config: {
          format: "yyyy/mm/dd",
          todayBtn: "linked",
          todayHighlight: true,
          autoclose: true,
        },
      },
    ],
  };

  $("#builder").queryBuilder(options);

  $(".parse-json").on("click", function () {
    const rules = $("#builder").queryBuilder("getRules");
    if (!rules || !rules.rules || rules.rules.length === 0) {
      console.log("no rule");
      fetchHolidays();
    } else {
      fetchHolidaysWithFilter(rules);
      console.log(JSON.stringify(rules, null, 2));
    }
  });

  function fetchHolidays() {
    const selectedCountry = $("#country-select").val();
    const selectedYear = $("#year-select").val();

    fetch(`/holidays?country=${selectedCountry}&year=${selectedYear}`)
      .then((response) => response.json())
      .then((data) => {
        console.log(data);
        displayHolidays(data);
      })
      .catch((error) => {
        console.error("Error fetching holidays:", error);
      });
  }

  function fetchHolidaysWithFilter(rules) {
    const selectedCountry = $("#country-select").val();
    const selectedYear = $("#year-select").val();

    const rulesJson = JSON.stringify(rules);

    fetch(`/holidays?country=${selectedCountry}&year=${selectedYear}`)
      .then((response) => response.json())
      .then((data) => {
        console.log("Sheessh");
        const filteredHolidays = applyFilters(data, rules);
        displayHolidays(filteredHolidays);
      })
      .catch((error) => {
        console.error("Error fetching holidays:", error);
      });
  }

  function displayHolidays(holidays) {
    const holidaysList = $("#holidays-list");
    holidaysList.html("");

    // Check if the holidays data is an array, and if not, convert it to an array
    if (!Array.isArray(holidays)) {
      holidays = [holidays];
    }

    holidays.forEach((holiday) => {
      const listItem = $('<li class="list-group-item"></li>');
      const name = holiday.name || "Unknown Name";
      const date =
        holiday.date && holiday.date.iso
          ? getFormattedDate(holiday.date.iso)
          : "Unknown Date";
      const nameDate = $("<p></p>").text(`${name} - ${date}`);
      const description = $('<p class="card-text"></p>').text(
        `Description: ${holiday.description || "No description available"}`
      );
      const linkItem = $('<p class="card-text"></p>');
      linkItem.html(
        `<a href="https://www.google.com/search?q=${encodeURIComponent(
          name + " " + (holiday.date.datetime ? holiday.date.datetime.year : "")
        )}" target="_blank">Google Search</a>`
      );
      listItem.append(nameDate, description, linkItem);
      holidaysList.append(listItem);
    });
  }

  function applyFilters(holiday, rules) {
    if (!rules || !rules.rules || rules.rules.length === 0) {
      return true;
    }

    for (const rule of rules.rules) {
      const { field, operator, value } = rule;
      let fieldValue;
      console.log(holiday);

      if (field === "date") {
        // For date fields, access the iso property of the date object
        fieldValue = holiday.date.iso;
      } else {
        fieldValue = holiday[field];
      }

      switch (operator) {
        case "equal":
          if (fieldValue !== value) {
            return false;
          }
          break;
        case "not_equal":
          if (fieldValue === value) {
            return false;
          }
          break;
        case "in":
          if (!value.includes(fieldValue)) {
            return false;
          }
          break;
        case "not_in":
          if (value.includes(fieldValue)) {
            return false;
          }
          break;
        case "begins_with":
          if (!fieldValue || !fieldValue.startsWith(value)) {
            return false;
          }
          break;
        case "not_begins_with":
          if (fieldValue && fieldValue.startsWith(value)) {
            return false;
          }
          break;
        case "contains":
          if (!fieldValue || !fieldValue.includes(value)) {
            return false;
          }
          break;
        case "not_contains":
          if (fieldValue && fieldValue.includes(value)) {
            return false;
          }
          break;
        case "ends_with":
          if (!fieldValue || !fieldValue.endsWith(value)) {
            return false;
          }
          break;
        case "not_ends_with":
          if (fieldValue && fieldValue.endsWith(value)) {
            return false;
          }
          break;
        case "is_empty":
          if (fieldValue !== "") {
            return false;
          }
          break;
        case "is_not_empty":
          if (fieldValue === "") {
            return false;
          }
          break;
        case "is_null":
          if (fieldValue !== null) {
            return false;
          }
          break;
        case "is_not_null":
          if (fieldValue === null) {
            return false;
          }
          break;
        // Add more cases to handle other operators if needed
        default:
          console.warn(`Unhandled operator: ${operator}`);
      }
    }
    // If the holiday matches all the filter conditions, return true to include it
    return true;
  }

  function getFormattedDate(dateObj) {
    if (dateObj && dateObj.iso) {
      const { year, month, day } = dateObj.iso.split("-");
      return `${year}-${month}-${day}`;
    }
    return "";
  }
});
