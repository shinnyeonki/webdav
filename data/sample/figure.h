#pragma once
#include "Misc.h"
#include "Windows.h"

class Figure
{
public:
	Figure();
	Figure(MPoint start,MPoint end);
	bool find(MPoint p);
	virtual void move(int x, int y);
	MPoint getStart();
	MPoint getEnd();
	virtual void draw(HDC dc);
protected:
	MPoint start_;
	MPoint end_;
};

class MRectangle : public Figure
{
public:
	MRectangle();
	MRectangle(MPoint start, MPoint end);
	void draw(HDC dc) override;
};

class MEllipse : public Figure
{
public:
	MEllipse();
	MEllipse(MPoint start, MPoint end);
	void draw(HDC dc) override;
};

class MLine : public Figure
{
public:
	MLine();
	MLine(MPoint start, MPoint end);
	void draw(HDC dc) override;
};
