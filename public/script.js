let uniqueIdCounter = 1;

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
        default_value: "",
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
          format: "yyyy-mm-dd",
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
      console.log("No rule, fetching all holidays");
      fetchHolidays();
    } else {
      rules.rules.forEach((rule) => {
        rule.uniqueId = "unique_" + uniqueIdCounter;
        uniqueIdCounter++;
      });
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

    fetch(`/holidays?country=${selectedCountry}&year=${selectedYear}`)
      .then((response) => response.json())
      .then((data) => {
        console.log("Applying filters");
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

    if (!Array.isArray(holidays)) {
      holidays = [holidays];
    }

    holidays.forEach((holiday) => {
      const listItem = $('<li class="list-group-item"></li>');
      const name = holiday.name || "Unknown Name";
      const date = holiday.date.iso;
      const nameDate = $("<p></p>").text(`${name} - ${date}`);
      const description = $('<p class="card-text"></p>').text(
        `${holiday.description || "No description available"}`
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

  function applyFilters(holidays, rules) {
    if (!rules || !rules.rules || rules.rules.length === 0) {
      return holidays;
    }

    function evaluateCondition(rule, holiday) {
      if (rule.condition === "OR") {
        return rule.rules.some((childRule) =>
          evaluateCondition(childRule, holiday)
        );
      } else if (rule.condition === "AND") {
        return rule.rules.every((childRule) =>
          evaluateCondition(childRule, holiday)
        );
      } else {
        return applyFilterRule(rule, holiday);
      }
    }

    var filteredHolidays = holidays.filter((holiday) =>
      evaluateCondition(rules, holiday)
    );

    return filteredHolidays;
  }

  function applyFilterRule(rule, holiday) {
    const { field, operator, value } = rule;
    if (field === "date") {
      var fieldValue = holiday[field].iso;
    } else {
      var fieldValue = holiday[field];
    }

    switch (operator) {
      case "equal":
        return fieldValue === value;
      case "not_equal":
        return fieldValue !== value;
      case "in":
        return value.includes(fieldValue);
      case "not_in":
        return !value.includes(fieldValue);
      case "begins_with":
        return fieldValue.startsWith(value);
      case "not_begins_with":
        return !fieldValue.startsWith(value);
      case "less_or_greater":
        const [startDate, endDate] = value.map((date) => new Date(date));
        const currentDate = new Date(fieldValue);
        return currentDate < startDate || currentDate > endDate;
      case "greater":
        return new Date(fieldValue) > new Date(value);
      case "greater_or_equal":
        return new Date(fieldValue) >= new Date(value);
      case "between":
        const [minDate, maxDate] = value.map((date) => new Date(date));
        const dateValue = new Date(fieldValue);
        return dateValue >= minDate && dateValue <= maxDate;
      case "not_between":
        const [notMinDate, notMaxDate] = value.map((date) => new Date(date));
        const notDateValue = new Date(fieldValue);
        return !(notDateValue >= notMinDate && notDateValue <= notMaxDate);
      case "is_null":
        return fieldValue === null;
      case "is_not_null":
        return fieldValue !== null;
      case "contains":
        return fieldValue && fieldValue.includes(value);
      case "not_contains":
        return !fieldValue || !fieldValue.includes(value);
      default:
        console.warn(`Unhandled operator: ${operator}`);
        return true;
    }
  }
});
