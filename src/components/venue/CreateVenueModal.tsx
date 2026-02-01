'use client';

import * as React from 'react';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { DBVenueSearchResult } from '@/types/database';

export interface CreateVenueModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    initialName?: string;
    onCreated: (venue: DBVenueSearchResult) => void;
}

interface FormData {
    name: string;
    city: string;
    country: string;
    address: string;
    instagram: string;
    website: string;
    google_maps_url: string;
}

export function CreateVenueModal({
    open,
    onOpenChange,
    initialName = '',
    onCreated,
}: CreateVenueModalProps) {
    const [formData, setFormData] = useState<FormData>({
        name: initialName,
        city: '',
        country: 'Korea',
        address: '',
        instagram: '',
        website: '',
        google_maps_url: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Reset form when modal opens with new initialName
    React.useEffect(() => {
        if (open) {
            setFormData((prev) => ({
                ...prev,
                name: initialName,
            }));
            setError(null);
        }
    }, [open, initialName]);

    const handleChange = (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData((prev) => ({ ...prev, [field]: e.target.value }));
        setError(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name.trim()) {
            setError('베뉴 이름을 입력해주세요.');
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            const res = await fetch('/api/venues', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formData.name.trim(),
                    city: formData.city.trim() || undefined,
                    country: formData.country.trim() || undefined,
                    address: formData.address.trim() || undefined,
                    instagram: formData.instagram.trim() || undefined,
                    website: formData.website.trim() || undefined,
                    google_maps_url: formData.google_maps_url.trim() || undefined,
                }),
            });

            const json = await res.json();

            if (!res.ok) {
                throw new Error(json.error || '베뉴 생성에 실패했습니다.');
            }

            // Convert to DBVenueSearchResult format
            const createdVenue: DBVenueSearchResult = {
                ...json.data,
                event_count: 0,
            };

            onCreated(createdVenue);
            onOpenChange(false);

            // Reset form
            setFormData({
                name: '',
                city: '',
                country: 'Korea',
                address: '',
                instagram: '',
                website: '',
                google_maps_url: '',
            });
        } catch (err) {
            setError(err instanceof Error ? err.message : '베뉴 생성에 실패했습니다.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>새 베뉴 추가</DialogTitle>
                        <DialogDescription>
                            새로운 베뉴 정보를 입력하세요. 이름은 필수입니다.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">
                                베뉴 이름 <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={handleChange('name')}
                                placeholder="예: Cakeshop"
                                autoFocus
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="city">도시</Label>
                                <Input
                                    id="city"
                                    value={formData.city}
                                    onChange={handleChange('city')}
                                    placeholder="예: Seoul"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="country">국가</Label>
                                <Input
                                    id="country"
                                    value={formData.country}
                                    onChange={handleChange('country')}
                                    placeholder="예: Korea"
                                />
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="address">주소</Label>
                            <Input
                                id="address"
                                value={formData.address}
                                onChange={handleChange('address')}
                                placeholder="예: 서울시 용산구 이태원로 134"
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="instagram">인스타그램</Label>
                            <Input
                                id="instagram"
                                value={formData.instagram}
                                onChange={handleChange('instagram')}
                                placeholder="예: @cakeshop_seoul"
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="website">웹사이트</Label>
                            <Input
                                id="website"
                                type="url"
                                value={formData.website}
                                onChange={handleChange('website')}
                                placeholder="https://"
                            />
                        </div>

                        {error && <p className="text-sm text-destructive">{error}</p>}
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={isSubmitting}
                        >
                            취소
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            추가
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
