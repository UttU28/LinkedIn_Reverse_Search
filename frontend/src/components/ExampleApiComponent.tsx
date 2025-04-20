import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { searchApi } from '../lib/api';
import { SearchRequest } from '../types/api';

export function ExampleApiComponent() {
  const queryClient = useQueryClient();
  const [searchData, setSearchData] = useState<SearchRequest>({
    name: '',
    company: '',
    position: '',
  });

  // Get all user searches
  const { data: searches, isLoading, error } = useQuery({
    queryKey: ['searches'],
    queryFn: searchApi.getUserSearches,
  });

  // Create a new search
  const createSearchMutation = useMutation({
    mutationFn: searchApi.createSearch,
    onSuccess: () => {
      // Invalidate and refetch the searches query
      queryClient.invalidateQueries({ queryKey: ['searches'] });
      // Reset form
      setSearchData({ name: '', company: '', position: '' });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createSearchMutation.mutate(searchData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSearchData(prev => ({ ...prev, [name]: value }));
  };

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {(error as Error).message}</div>;

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">LinkedIn Search</h2>
      
      {/* Search Form */}
      <form onSubmit={handleSubmit} className="mb-8 space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium mb-1">Name</label>
          <input
            type="text"
            id="name"
            name="name"
            value={searchData.name}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        <div>
          <label htmlFor="company" className="block text-sm font-medium mb-1">Company</label>
          <input
            type="text"
            id="company"
            name="company"
            value={searchData.company}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        <div>
          <label htmlFor="position" className="block text-sm font-medium mb-1">Position</label>
          <input
            type="text"
            id="position"
            name="position"
            value={searchData.position}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        <div>
          <label htmlFor="title" className="block text-sm font-medium mb-1">Title (optional)</label>
          <input
            type="text"
            id="title"
            name="title"
            value={searchData.title || ''}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          />
        </div>
        <button 
          type="submit" 
          className="px-4 py-2 bg-blue-600 text-white rounded"
          disabled={createSearchMutation.isPending}
        >
          {createSearchMutation.isPending ? 'Searching...' : 'Search LinkedIn'}
        </button>
      </form>

      {/* Search Results */}
      <div>
        <h3 className="text-lg font-semibold mb-2">Previous Searches</h3>
        {searches && searches.length > 0 ? (
          <div className="space-y-4">
            {searches.map(search => (
              <div key={search.id} className="p-4 border rounded">
                <p><strong>Name:</strong> {search.name}</p>
                <p><strong>Company:</strong> {search.company}</p>
                <p><strong>Position:</strong> {search.position}</p>
                <p><strong>Status:</strong> {search.status}</p>
                {search.linkedInUrl && (
                  <a 
                    href={search.linkedInUrl} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-blue-600 hover:underline"
                  >
                    View LinkedIn Profile
                  </a>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p>No searches found</p>
        )}
      </div>
    </div>
  );
} 