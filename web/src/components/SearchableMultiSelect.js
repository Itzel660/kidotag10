import React, { useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronDown,
  faLock,
  faSearch,
} from "@fortawesome/free-solid-svg-icons";
import "./SearchableMultiSelect.css";

const SearchableMultiSelect = ({
  options = [],
  selectedValues = [],
  onChange = () => {},
  placeholder = "Selecciona opciones",
  searchPlaceholder = "Buscar...",
  emptyMessage = "No hay resultados",
  disabled = false,
}) => {
  const containerRef = useRef(null);
  const searchInputRef = useRef(null);
  const [abierto, setAbierto] = useState(false);
  const [busqueda, setBusqueda] = useState("");

  const valoresSeleccionados = Array.isArray(selectedValues)
    ? selectedValues
    : [];
  const seleccionados = new Set(valoresSeleccionados);
  const textoBusqueda = busqueda.trim().toLowerCase();
  const opcionesSeleccionadas = options.filter((option) =>
    seleccionados.has(option.value),
  );
  const opcionesFiltradas = options.filter((option) => {
    if (!textoBusqueda) {
      return true;
    }

    const label = option.label?.toLowerCase() || "";
    const description = option.description?.toLowerCase() || "";

    return label.includes(textoBusqueda) || description.includes(textoBusqueda);
  });

  useEffect(() => {
    if (!abierto) {
      setBusqueda("");
      return;
    }

    searchInputRef.current?.focus();
  }, [abierto]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setAbierto(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setAbierto(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const toggleOption = (option) => {
    const bloqueado = option.locked && seleccionados.has(option.value);
    if (bloqueado) {
      return;
    }

    if (seleccionados.has(option.value)) {
      onChange(valoresSeleccionados.filter((value) => value !== option.value));
      return;
    }

    onChange([...valoresSeleccionados, option.value]);
  };

  const resumenSeleccion =
    opcionesSeleccionadas.length === 0
      ? placeholder
      : `${opcionesSeleccionadas.length} alumno${opcionesSeleccionadas.length === 1 ? "" : "s"} seleccionado${opcionesSeleccionadas.length === 1 ? "" : "s"}`;
  const detalleSeleccion = opcionesSeleccionadas
    .map((option) => option.label)
    .join(", ");

  return (
    <div
      className={`searchable-multi-select ${abierto ? "is-open" : ""} ${disabled ? "is-disabled" : ""}`}
      ref={containerRef}
    >
      <button
        type="button"
        className="searchable-multi-select__trigger"
        onClick={() => !disabled && setAbierto((prev) => !prev)}
        aria-expanded={abierto}
        disabled={disabled}
      >
        <div className="searchable-multi-select__trigger-content">
          <span
            className={`searchable-multi-select__summary ${opcionesSeleccionadas.length === 0 ? "is-placeholder" : ""}`}
          >
            {resumenSeleccion}
          </span>
          <span className="searchable-multi-select__detail">
            {detalleSeleccion || "Busca por nombre o UID"}
          </span>
        </div>
        <FontAwesomeIcon
          icon={faChevronDown}
          className="searchable-multi-select__icon"
        />
      </button>

      {abierto && !disabled && (
        <div className="searchable-multi-select__panel">
          <div className="searchable-multi-select__search">
            <FontAwesomeIcon
              icon={faSearch}
              className="searchable-multi-select__search-icon"
            />
            <input
              ref={searchInputRef}
              type="text"
              value={busqueda}
              onChange={(event) => setBusqueda(event.target.value)}
              placeholder={searchPlaceholder}
            />
          </div>

          {opcionesSeleccionadas.length > 0 && (
            <div className="searchable-multi-select__chips">
              {opcionesSeleccionadas.map((option) => (
                <span
                  key={option.value}
                  className={`searchable-multi-select__chip ${option.locked ? "is-locked" : ""}`}
                >
                  {option.label}
                  {option.locked && <FontAwesomeIcon icon={faLock} />}
                </span>
              ))}
            </div>
          )}

          <div className="searchable-multi-select__options">
            {opcionesFiltradas.length === 0 ? (
              <div className="searchable-multi-select__empty">
                {emptyMessage}
              </div>
            ) : (
              opcionesFiltradas.map((option) => {
                const seleccionado = seleccionados.has(option.value);
                const bloqueado = option.locked && seleccionado;

                return (
                  <label
                    key={option.value}
                    className={`searchable-multi-select__option ${seleccionado ? "is-selected" : ""} ${bloqueado ? "is-locked" : ""}`}
                  >
                    <input
                      type="checkbox"
                      checked={seleccionado}
                      onChange={() => toggleOption(option)}
                      disabled={bloqueado}
                    />
                    <div className="searchable-multi-select__option-info">
                      <span className="searchable-multi-select__option-label-row">
                        <span className="searchable-multi-select__option-label">
                          {option.label}
                        </span>
                        {bloqueado && (
                          <span className="searchable-multi-select__badge">
                            <FontAwesomeIcon icon={faLock} /> Fijo
                          </span>
                        )}
                      </span>
                      {option.description && (
                        <span className="searchable-multi-select__option-description">
                          {option.description}
                        </span>
                      )}
                    </div>
                  </label>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchableMultiSelect;
