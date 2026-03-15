"use client";

import { useState, useEffect, useCallback } from "react";
import AddNewCardModal from "@/components/AddNewCardModal";
import AddCategoryModal from "@/components/AddCategoryModal";
import AddSubcategoryModal from "@/components/AddSubcategoryModal";
import AddSkipKeywordModal from "@/components/AddSkipKeywordModal";

type Card = { id: string; name: string; owner: string; label: string };

type Subcategory = {
  id: string;
  name: string;
  categoryId: string | null;
  categoryName: string | null;
};

export default function ConfigsPage() {
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddCardModalOpen, setIsAddCardModalOpen] = useState(false);
  const [editCard, setEditCard] = useState<{
    id: string;
    owner: string;
    cardName: string;
    dateHeader: string;
    descriptionHeader: string;
    debitHeader: string | null;
    creditHeader: string | null;
    singleColumn: boolean;
  } | null>(null);

  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);
  const [isAddCategoryModalOpen, setIsAddCategoryModalOpen] = useState(false);
  const [editCategory, setEditCategory] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [subcategoriesLoading, setSubcategoriesLoading] = useState(true);
  const [subcategoriesError, setSubcategoriesError] = useState<string | null>(null);
  const [isAddSubcategoryModalOpen, setIsAddSubcategoryModalOpen] = useState(false);
  const [editSubcategory, setEditSubcategory] = useState<{
    id: string;
    name: string;
    categoryId: string;
  } | null>(null);

  const [skipKeywords, setSkipKeywords] = useState<string[]>([]);
  const [skipKeywordsLoading, setSkipKeywordsLoading] = useState(true);
  const [skipKeywordsError, setSkipKeywordsError] = useState<string | null>(null);
  const [isAddSkipKeywordModalOpen, setIsAddSkipKeywordModalOpen] = useState(false);
  const [editSkipKeyword, setEditSkipKeyword] = useState<string | null>(null);

  const fetchCards = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/cards");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch cards");
      setCards(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load cards");
      setCards([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    setCategoriesLoading(true);
    setCategoriesError(null);
    try {
      const res = await fetch("/api/categories");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch categories");
      setCategories(Array.isArray(data) ? data : []);
    } catch (err) {
      setCategoriesError(err instanceof Error ? err.message : "Failed to load categories");
      setCategories([]);
    } finally {
      setCategoriesLoading(false);
    }
  }, []);

  const fetchSubcategories = useCallback(async () => {
    setSubcategoriesLoading(true);
    setSubcategoriesError(null);
    try {
      const res = await fetch("/api/subcategories");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch subcategories");
      setSubcategories(Array.isArray(data) ? data : []);
    } catch (err) {
      setSubcategoriesError(err instanceof Error ? err.message : "Failed to load subcategories");
      setSubcategories([]);
    } finally {
      setSubcategoriesLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCards();
  }, [fetchCards]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    fetchSubcategories();
  }, [fetchSubcategories]);

  const fetchSkipKeywords = useCallback(async () => {
    setSkipKeywordsLoading(true);
    setSkipKeywordsError(null);
    try {
      const res = await fetch("/api/skip-keywords");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch skip keywords");
      setSkipKeywords(Array.isArray(data) ? data.map((r: { keyword: string }) => r.keyword) : []);
    } catch (err) {
      setSkipKeywordsError(err instanceof Error ? err.message : "Failed to load skip keywords");
      setSkipKeywords([]);
    } finally {
      setSkipKeywordsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSkipKeywords();
  }, [fetchSkipKeywords]);

  const handleAddCard = async (card: {
    owner: string;
    cardName: string;
    dateHeader: string;
    descriptionHeader: string;
    debitHeader: string | null;
    creditHeader: string | null;
    singleColumn: boolean;
  }) => {
    try {
      const res = await fetch("/api/cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          owner: card.owner,
          cardName: card.cardName,
          dateHeader: card.dateHeader,
          descriptionHeader: card.descriptionHeader,
          debitHeader: card.debitHeader,
          creditHeader: card.creditHeader,
          singleColumn: card.singleColumn,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add card");
      await fetchCards();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add card");
    }
  };

  const handleAddCategory = async (name: string) => {
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add category");
      await fetchCategories();
      await fetchSubcategories();
    } catch (err) {
      setCategoriesError(err instanceof Error ? err.message : "Failed to add category");
    }
  };

  const handleEditCategory = async (id: string, name: string) => {
    try {
      const res = await fetch(`/api/categories/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) throw new Error("Failed to update category");
      setEditCategory(null);
      await fetchCategories();
      await fetchSubcategories();
    } catch (err) {
      setCategoriesError(err instanceof Error ? err.message : "Failed to update category");
    }
  };

  const handleAddSubcategory = async (categoryId: string, name: string) => {
    try {
      const res = await fetch("/api/subcategories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoryId: categoryId || null,
          name,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add subcategory");
      await fetchSubcategories();
    } catch (err) {
      setSubcategoriesError(err instanceof Error ? err.message : "Failed to add subcategory");
    }
  };

  const handleEditCard = async (id: string, card: {
    owner: string;
    cardName: string;
    dateHeader: string;
    descriptionHeader: string;
    debitHeader: string | null;
    creditHeader: string | null;
    singleColumn: boolean;
  }) => {
    try {
      const res = await fetch(`/api/cards/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          owner: card.owner,
          cardName: card.cardName,
          dateHeader: card.dateHeader,
          descriptionHeader: card.descriptionHeader,
          debitHeader: card.debitHeader,
          creditHeader: card.creditHeader,
          singleColumn: card.singleColumn,
        }),
      });
      if (!res.ok) throw new Error("Failed to update card");
      setEditCard(null);
      await fetchCards();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update card");
    }
  };

  const handleEditSubcategory = async (
    id: string,
    categoryId: string,
    name: string
  ) => {
    try {
      const res = await fetch(`/api/subcategories/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categoryId, name }),
      });
      if (!res.ok) throw new Error("Failed to update subcategory");
      setEditSubcategory(null);
      await fetchSubcategories();
    } catch (err) {
      setSubcategoriesError(err instanceof Error ? err.message : "Failed to update subcategory");
    }
  };

  const handleAddSkipKeyword = async (keyword: string) => {
    try {
      const res = await fetch("/api/skip-keywords", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add skip keyword");
      await fetchSkipKeywords();
    } catch (err) {
      setSkipKeywordsError(err instanceof Error ? err.message : "Failed to add skip keyword");
    }
  };

  const handleEditSkipKeyword = async (oldKeyword: string, newKeyword: string) => {
    try {
      const delRes = await fetch("/api/skip-keywords", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword: oldKeyword }),
      });
      if (!delRes.ok) throw new Error("Failed to update skip keyword");
      const addRes = await fetch("/api/skip-keywords", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword: newKeyword }),
      });
      const data = await addRes.json();
      if (!addRes.ok) throw new Error(data.error || "Failed to update skip keyword");
      setEditSkipKeyword(null);
      await fetchSkipKeywords();
    } catch (err) {
      setSkipKeywordsError(err instanceof Error ? err.message : "Failed to update skip keyword");
    }
  };

  const handleDeleteSkipKeyword = async (keyword: string) => {
    try {
      const res = await fetch("/api/skip-keywords", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword }),
      });
      if (!res.ok) throw new Error("Failed to delete skip keyword");
      setEditSkipKeyword(null);
      await fetchSkipKeywords();
    } catch (err) {
      setSkipKeywordsError(err instanceof Error ? err.message : "Failed to delete skip keyword");
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Configs</h1>
        <p className="mt-1 text-sm text-gray-500">Configuration settings</p>
      </div>

      <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold text-gray-800">Cards</h2>
        <button
          onClick={() => {
            setEditCard(null);
            setIsAddCardModalOpen(true);
          }}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover transition-colors"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          Add Card
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {loading ? (
          <div className="flex justify-center py-12">
            <p className="text-gray-500">Loading...</p>
          </div>
        ) : error ? (
          <div className="flex justify-center py-12">
            <p className="text-red-600">{error}</p>
          </div>
        ) : cards.length === 0 ? (
          <div className="py-12 text-center text-gray-500">
            No cards yet. Click &quot;Add Card&quot; to create one.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[400px]">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    Owner
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    Card Name
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                    Edit
                  </th>
                </tr>
              </thead>
              <tbody>
                {cards.map((row) => (
                  <tr
                    key={row.id}
                    className="border-t border-gray-100 hover:bg-gray-50"
                  >
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {row.owner}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {row.name}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={async () => {
                          const res = await fetch(`/api/cards/${row.id}`);
                          const data = await res.json();
                          if (res.ok) setEditCard(data);
                        }}
                        className="rounded p-1.5 text-gray-500 hover:bg-gray-100 hover:text-primary transition-colors"
                        title="Edit card"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AddNewCardModal
        isOpen={isAddCardModalOpen || !!editCard}
        onClose={() => {
          setIsAddCardModalOpen(false);
          setEditCard(null);
        }}
        onAdd={handleAddCard}
        editCard={editCard}
        onEdit={handleEditCard}
      />

      <div className="mt-8">
        <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold text-gray-800">Category</h2>
          <button
            onClick={() => {
              setEditCategory(null);
              setIsAddCategoryModalOpen(true);
            }}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover transition-colors"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Add Category
          </button>
        </div>

        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          {categoriesLoading ? (
            <div className="flex justify-center py-12">
              <p className="text-gray-500">Loading...</p>
            </div>
          ) : categoriesError ? (
            <div className="flex justify-center py-12">
              <p className="text-red-600">{categoriesError}</p>
            </div>
          ) : categories.length === 0 ? (
            <div className="py-12 text-center text-gray-500">
              No categories yet. Click &quot;Add Category&quot; to create one.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[400px]">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                      Name
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                      Edit
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((row) => (
                    <tr
                      key={row.id}
                      className="border-t border-gray-100 hover:bg-gray-50"
                    >
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {row.name}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={async () => {
                            const res = await fetch(`/api/categories/${row.id}`);
                            const data = await res.json();
                            if (res.ok) setEditCategory(data);
                          }}
                          className="rounded p-1.5 text-gray-500 hover:bg-gray-100 hover:text-primary transition-colors"
                          title="Edit category"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <AddCategoryModal
        isOpen={isAddCategoryModalOpen || !!editCategory}
        onClose={() => {
          setIsAddCategoryModalOpen(false);
          setEditCategory(null);
        }}
        onAdd={handleAddCategory}
        editCategory={editCategory}
        onEdit={handleEditCategory}
      />

      <div className="mt-8">
        <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold text-gray-800">Sub Category</h2>
          <button
            onClick={() => {
              setEditSubcategory(null);
              setIsAddSubcategoryModalOpen(true);
            }}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover transition-colors"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Add Subcategory
          </button>
        </div>

        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          {subcategoriesLoading ? (
            <div className="flex justify-center py-12">
              <p className="text-gray-500">Loading...</p>
            </div>
          ) : subcategoriesError ? (
            <div className="flex justify-center py-12">
              <p className="text-red-600">{subcategoriesError}</p>
            </div>
          ) : subcategories.length === 0 ? (
            <div className="py-12 text-center text-gray-500">
              No subcategories yet. Click &quot;Add Subcategory&quot; to create one.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[400px]">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                      Name
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                      Category
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                      Edit
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {subcategories.map((row) => (
                    <tr
                      key={row.id}
                      className="border-t border-gray-100 hover:bg-gray-50"
                    >
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {row.name}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {row.categoryName ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={async () => {
                            const res = await fetch(`/api/subcategories/${row.id}`);
                            const data = await res.json();
                            if (res.ok) setEditSubcategory(data);
                          }}
                          className="rounded p-1.5 text-gray-500 hover:bg-gray-100 hover:text-primary transition-colors"
                          title="Edit subcategory"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <AddSubcategoryModal
        isOpen={isAddSubcategoryModalOpen || !!editSubcategory}
        onClose={() => {
          setIsAddSubcategoryModalOpen(false);
          setEditSubcategory(null);
        }}
        onAdd={handleAddSubcategory}
        editSubcategory={editSubcategory}
        onEdit={handleEditSubcategory}
      />

      <div className="mt-8">
        <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold text-gray-800">Skip Keywords</h2>
          <button
            onClick={() => {
              setEditSkipKeyword(null);
              setIsAddSkipKeywordModalOpen(true);
            }}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover transition-colors"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Add Keyword
          </button>
        </div>

        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          {skipKeywordsLoading ? (
            <div className="flex justify-center py-12">
              <p className="text-gray-500">Loading...</p>
            </div>
          ) : skipKeywordsError ? (
            <div className="flex justify-center py-12">
              <p className="text-red-600">{skipKeywordsError}</p>
            </div>
          ) : skipKeywords.length === 0 ? (
            <div className="py-12 text-center text-gray-500">
              No skip keywords yet. Transactions whose description contains a keyword will be skipped during import.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[400px]">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                      Keyword
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                      Edit
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                      Delete
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {skipKeywords.map((keyword) => (
                    <tr
                      key={keyword}
                      className="border-t border-gray-100 hover:bg-gray-50"
                    >
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {keyword}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => setEditSkipKeyword(keyword)}
                          className="rounded p-1.5 text-gray-500 hover:bg-gray-100 hover:text-primary transition-colors"
                          title="Edit keyword"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleDeleteSkipKeyword(keyword)}
                          className="rounded p-1.5 text-gray-500 hover:bg-gray-100 hover:text-red-600 transition-colors"
                          title="Delete keyword"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <AddSkipKeywordModal
        isOpen={isAddSkipKeywordModalOpen || !!editSkipKeyword}
        onClose={() => {
          setIsAddSkipKeywordModalOpen(false);
          setEditSkipKeyword(null);
        }}
        onAdd={handleAddSkipKeyword}
        editKeyword={editSkipKeyword}
        onEdit={handleEditSkipKeyword}
      />
    </div>
  );
}
